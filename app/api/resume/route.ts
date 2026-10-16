import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import mammoth from "mammoth";
import { generateRawApiKey, encrypt } from "@/lib/api-key";

export const runtime = "nodejs";
export const maxDuration = 60;

// Free AI provider: Google Gemini (key from https://aistudio.google.com/apikey)
// Primary model first, then a lighter backup model if the primary is busy/unavailable.
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type HttpError = Error & { status?: number };

async function callGeminiOnce(model: string, parts: unknown[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.2,
        },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const e = new Error(`Gemini ${model} ${res.status}: ${body.slice(0, 500)}`) as HttpError;
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function callGemini(parts: unknown[]): Promise<string> {
  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    // up to 3 tries per model for temporary overload (500/503), with short waits
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGeminiOnce(model, parts);
      } catch (err) {
        lastErr = err;
        const status = (err as HttpError).status;
        console.error(`Gemini attempt failed (${model}, try ${attempt + 1}):`, (err as Error).message);
        if (status === 500 || status === 503) {
          await sleep(1500 * (attempt + 1));
          continue; // retry same model
        }
        break; // 429 / 404 / 400 etc: move on to the next model
      }
    }
  }
  throw lastErr;
}

const PROMPT = `You are a senior technical recruiter and ATS expert. Analyze the attached resume and return ONLY one valid JSON object. No markdown, no code fences, no commentary.

RULES
- Base everything strictly on what is written in the resume. Never invent skills, jobs, numbers or achievements.
- If the document is not a resume/CV, return {"isResume": false} and nothing else.
- Be specific: quote or reference actual content (job names, projects, skills) in suggestions.
- Do not give generic advice like "improve formatting" unless you say exactly what is wrong.

SCORING (total 100, add up these parts):
- Structure and sections (20): clear standard headings, logical order, nothing important missing
- Contact and ATS readability (15): email, phone, links present; no tables/columns/graphics that break parsing; consistent dates
- Experience and project quality (25): action verbs, measurable results (numbers, %, scale), relevance, clear role and impact
- Skills and keywords (20): relevant technical skills, tools and technologies, grouped clearly, matching industry terms
- Education, certifications, achievements (10)
- Clarity and length (10): concise bullets, no grammar errors, 1-2 pages worth of content
Score strictly. Most real resumes land between 45 and 80. Give 85+ only if all areas are strong, with quantified results. Give below 40 only for very thin or badly structured resumes.

Return this exact JSON structure:
{
  "isResume": true,
  "atsScore": <integer 0-100, sum of the parts above>,
  "scoreBreakdown": {
    "structure": <0-20>,
    "readability": <0-15>,
    "experience": <0-25>,
    "skills": <0-20>,
    "education": <0-10>,
    "clarity": <0-10>
  },
  "sections": {
    "contact": <true/false>,
    "summary": <true/false>,
    "experience": <true/false>,
    "education": <true/false>,
    "skills": <true/false>,
    "projects": <true/false>,
    "certifications": <true/false>,
    "achievements": <true/false>
  },
  "keywords": [<up to 25 technical skills, tools, languages and frameworks actually found, no duplicates>],
  "missingKeywords": [<up to 8 common keywords for the best-fit job titles that are absent>],
  "suggestions": [<4-6 items, each one sentence, starting with the section name, e.g. "Experience: Rewrite 'Worked on billing app' to show impact, like '...'" , ordered by importance>],
  "strengths": [<2-4 specific things done well, referencing real content>],
  "jobTitles": [<2-3 job titles this resume suits best>],
  "experienceLevel": "<Junior|Mid|Senior|Lead|Executive>"
}

Before answering, double check that the breakdown numbers add up to atsScore and that the JSON is valid.`;

type AiResult = {
  atsScore: number;
  sections: Record<string, boolean>;
  keywords: string[];
  suggestions: string[];
  strengths: string[];
  jobTitles: string[];
  experienceLevel: string;
  wordCount: number;
};

function detectKind(file: File): "pdf" | "docx" | "txt" | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  if (file.type === "text/plain" || name.endsWith(".txt")) return "txt";
  return null;
}

function parseJson(text: string): AiResult {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(clean.slice(start, end + 1));
}

async function getOrCreateDefaultKey(userId: string) {
  const existing = await prisma.apiKey
    .findFirst({ where: { userId, revokedAt: null }, orderBy: { createdAt: "asc" } })
    .catch(() => null);
  if (existing) return existing;
  const rawKey = generateRawApiKey();
  return prisma.apiKey
    .create({
      data: {
        userId,
        name: "Default key",
        encryptedKey: encrypt(rawKey),
        last4: rawKey.slice(-4),
      },
    })
    .catch(() => null);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Add it to .env and restart." },
      { status: 500 }
    );
  }

  // quota
  const subscription = await prisma.subscription
    .findUnique({ where: { userId }, include: { plan: true } })
    .catch(() => null);
  const planName = (subscription?.plan?.name ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planName];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  if (limit !== Infinity) {
    const agg = await prisma.usage
      .aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { count: true } })
      .catch(() => ({ _sum: { count: 0 } }));
    const used = agg._sum.count ?? 0;
    if (used >= limit) {
      return NextResponse.json(
        { error: "Monthly quota exceeded", plan: planName, limit, used },
        { status: 429 }
      );
    }
  }

  // file
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)." }, { status: 400 });
  }

  const kind = detectKind(file);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload PDF, DOCX or TXT." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let parts: unknown[];
  let rawText = "";

  try {
    if (kind === "pdf") {
      parts = [
        { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
        { text: PROMPT },
      ];
      rawText = "[PDF analyzed directly]";
    } else {
      rawText =
        kind === "docx"
          ? (await mammoth.extractRawText({ buffer })).value
          : buffer.toString("utf-8");
      rawText = rawText.trim();
      if (rawText.length < 50) {
        return NextResponse.json(
          { error: "Could not read enough text from this file." },
          { status: 400 }
        );
      }
      parts = [{ text: `${PROMPT}\n\nResume text:\n"""\n${rawText.slice(0, 12000)}\n"""` }];
    }
  } catch (err) {
    console.error("File read failed:", err);
    return NextResponse.json({ error: "Could not read this file." }, { status: 400 });
  }

  // Claude analysis
  let aiResult: AiResult;
  try {
    const text = await callGemini(parts);
    aiResult = parseJson(text);
  } catch (err) {
    // Full details go to Vercel Logs; the user gets a clear, safe message.
    const status = (err as { status?: number })?.status;
    const detail = (err as { message?: string })?.message;
    console.error("Resume analysis failed:", { status, detail, err });

    let msg = "Analysis failed. Please try again.";
    if (status === 401 || status === 403 || /API key not valid|API_KEY_INVALID/i.test(detail ?? ""))
      msg = "Analysis service is not configured correctly (invalid API key).";
    else if (status === 404) msg = "Analysis service is misconfigured (model not found).";
    else if (status === 429)
      msg = "Free AI limit reached for now. Please wait a minute (or until tomorrow) and retry.";
    else if (status && status >= 500) msg = "The analysis service is busy. Please try again in a moment.";
    else if (err instanceof SyntaxError || /No JSON|Empty response/.test(detail ?? ""))
      msg = "Could not read the analysis result. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  aiResult.keywords ??= [];
  aiResult.suggestions ??= [];
  aiResult.strengths ??= [];
  aiResult.jobTitles ??= [];
  aiResult.sections ??= {};

  const summary = `${aiResult.wordCount ?? 0} words · ATS score ${aiResult.atsScore}/100 · ${aiResult.keywords.length} skills detected · ${aiResult.experienceLevel} level · Best for: ${aiResult.jobTitles.slice(0, 2).join(", ")}`;

  const analysis = await prisma.resumeAnalysis
    .create({
      data: {
        userId,
        fileName: file.name,
        atsScore: aiResult.atsScore,
        summary,
        sections: aiResult.sections,
        keywords: aiResult.keywords,
        suggestions: aiResult.suggestions,
        rawText: rawText.slice(0, 5000),
      },
    })
    .catch((e) => {
      console.error("DB save failed (did you run prisma db push?):", e);
      return null;
    });

  const apiKey = await getOrCreateDefaultKey(userId);
  if (apiKey) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.usage
      .upsert({
        where: { apiKeyId_date: { apiKeyId: apiKey.id, date: today } },
        update: { count: { increment: 1 } },
        create: { apiKeyId: apiKey.id, userId, date: today, count: 1 },
      })
      .catch(() => null);
  }

  return NextResponse.json({
    atsScore: aiResult.atsScore,
    summary,
    sections: aiResult.sections,
    keywords: aiResult.keywords,
    suggestions: aiResult.suggestions,
    strengths: aiResult.strengths,
    jobTitles: aiResult.jobTitles,
    experienceLevel: aiResult.experienceLevel,
    wordCount: aiResult.wordCount,
    analysisId: analysis?.id,
  });
}