import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import { generateRawApiKey, encrypt } from "@/lib/api-key";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the resume and return ONLY a valid JSON object with no extra text, no markdown, no explanation.

Return this exact JSON structure:
{
  "atsScore": <number 0-100>,
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
  "keywords": [<technical skills, tools, languages found>],
  "suggestions": [<3-6 specific actionable suggestions>],
  "strengths": [<2-4 things the resume does well>],
  "jobTitles": [<2-3 job titles this resume suits best>],
  "experienceLevel": "<Junior|Mid|Senior|Lead|Executive>",
  "wordCount": <number>
}

ATS score criteria:
- 80-100: Excellent, well structured, keyword rich
- 60-79: Good, minor improvements needed
- 40-59: Average, significant gaps
- 0-39: Poor, major restructuring needed

Be specific. Analyze the actual content, not generic advice.`;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env and restart." },
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

  let content: Anthropic.MessageParam["content"];
  let rawText = "";

  try {
    if (kind === "pdf") {
      content = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
        },
        { type: "text", text: PROMPT },
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
      content = `${PROMPT}\n\nResume text:\n"""\n${rawText.slice(0, 12000)}\n"""`;
    }
  } catch (err) {
    console.error("File read failed:", err);
    return NextResponse.json({ error: "Could not read this file." }, { status: 400 });
  }

  // Claude analysis
  let aiResult: AiResult;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    aiResult = parseJson(text);
  } catch (err) {
    console.error("Claude analysis failed:", err);
    return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 500 });
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