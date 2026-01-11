import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { trackUsageEvent } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    /* =========================
       GET USER PLAN
    ========================= */
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { plan: true },
    });

    const planName = subscription?.plan?.name ?? "FREE";
    const limit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];

    /* =========================
       MONTH START
    ========================= */
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    /* =========================
       CURRENT MONTH USAGE
    ========================= */
    const usage = await prisma.usage.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: monthStart },
      },
      _sum: { count: true },
    });

    const totalUsage = usage._sum.count ?? 0;

    /* 🚨 HARD LIMIT CHECK (THE FIX) */
    if (limit !== Infinity && totalUsage >= limit) {
      return NextResponse.json(
        {
          error: "Monthly limit exceeded",
          plan: planName,
          limit,
        },
        { status: 429 }
      );
    }

    /* =========================
       API KEY CHECK
    ========================= */
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "No API key found" }, { status: 400 });
    }

    /* =========================
       RECORD USAGE (ONLY AFTER CHECK)
    ========================= */
    await trackUsageEvent({
      userId: session.user.id,
      apiKeyId: apiKey.id,
      endpoint: "text-analysis",
    });

    /* =========================
       RESPONSE
    ========================= */
    return NextResponse.json({
      result: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        sentiment: "neutral",
      },
    });
  } catch (err) {
    console.error("Text analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
