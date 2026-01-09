import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { trackUsageEvent } from "@/lib/usage";

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

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "No API key found" }, { status: 400 });
    }

    await trackUsageEvent({
      userId: session.user.id,
      apiKeyId: apiKey.id,
      endpoint: "text-analysis",
    });

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
