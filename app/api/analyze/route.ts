import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { ensureDefaultKey, getActiveKey, noKeyResponse } from "@/lib/default-key";

function analyzeText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const words = trimmed.match(/\b\w+\b/g) || [];
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const wordFreq: Record<string, number> = {};
  let longestWord = "";
  const stopWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","it","as","be","was","are",
  ]);

  words.forEach((w) => {
    const lower = w.toLowerCase();
    wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    if (w.length > longestWord.length) longestWord = w;
  });

  const uniqueWords = Object.keys(wordFreq).length;
  const mostCommonWord =
    Object.entries(wordFreq)
      .filter(([w]) => !stopWords.has(w))
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const readingTimeMin = words.length / 200;
  const readingTime =
    readingTimeMin < 1
      ? `${Math.ceil(readingTimeMin * 60)} sec`
      : `${Math.ceil(readingTimeMin)} min`;

  const avgWordsPerSentence =
    sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

  const syllableCount = words.reduce((acc, w) => {
    const s = w
      .toLowerCase()
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "");
    const matches = s.match(/[aeiouy]{1,2}/g);
    return acc + Math.max(1, matches ? matches.length : 1);
  }, 0);

  const flesch =
    sentences.length > 0 && words.length > 0
      ? Math.round(
          206.835 -
            1.015 * (words.length / sentences.length) -
            84.6 * (syllableCount / words.length)
        )
      : 0;

  const fleschScore = Math.max(0, Math.min(100, flesch));

  const readabilityLabel =
    fleschScore >= 90 ? "Very Easy" :
    fleschScore >= 70 ? "Easy" :
    fleschScore >= 60 ? "Standard" :
    fleschScore >= 50 ? "Fairly Difficult" :
    fleschScore >= 30 ? "Difficult" : "Very Difficult";

  const topWords = Object.entries(wordFreq)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return {
    wordCount: words.length,
    charCount: text.length,
    charNoSpaces: text.replace(/\s/g, "").length,
    sentenceCount: sentences.length,
    paragraphCount: Math.max(1, paragraphs.length),
    avgWordsPerSentence,
    readingTime,
    uniqueWords,
    longestWord,
    mostCommonWord,
    fleschScore,
    readabilityLabel,
    topWords,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const body = await req.json().catch(() => null);
  const text: string = body?.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  // An active API key is required to run an analysis
  await ensureDefaultKey(userId);
  const apiKey = await getActiveKey(userId);
  if (!apiKey) return noKeyResponse();

  const subscription = await prisma.subscription
    .findUnique({ where: { userId }, include: { plan: true } })
    .catch(() => null);

  const planName = (subscription?.plan?.name ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planName];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  if (limit !== Infinity) {
    const usageAgg = await prisma.usage
      .aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { count: true } })
      .catch(() => ({ _sum: { count: 0 } }));

    const used = usageAgg._sum.count ?? 0;

    if (used >= limit) {
      return NextResponse.json(
        { error: "Monthly quota exceeded", plan: planName, limit, used },
        { status: 429 }
      );
    }
  }

  {
    // record usage against the user's active key
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

  const result = analyzeText(text);
  if (!result) {
    return NextResponse.json({ error: "Could not analyze text" }, { status: 400 });
  }

  const analysis = await prisma.analysis
    .create({
      data: {
        userId,
        preview: text.trim().slice(0, 120),
        fullText: text.trim(),
        wordCount: result.wordCount,
        fleschScore: result.fleschScore,
        readability: result.readabilityLabel,
        result,
      },
    })
    .catch((err) => {
      console.error("Failed to save analysis history:", err);
      return null;
    });

  return NextResponse.json({ result, tracked: !!apiKey, analysisId: analysis?.id ?? null });
}