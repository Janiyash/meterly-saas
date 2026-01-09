import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/validate-api-key";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 401 }
      );
    }

    const rawKey = authHeader.replace("Bearer ", "").trim();

    const apiKey = await validateApiKey(rawKey);

    if (!apiKey) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // ✅ Track usage (NO lastUsedAt here)
    await prisma.apiUsage.upsert({
      where: {
        userId_date: {
          userId: apiKey.userId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        count: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usage tracked",
    });
  } catch (error) {
    console.error("TRACK ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
