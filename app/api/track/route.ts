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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔧 FIX: replace upsert (invalid) with find + update/create
    const existing = await prisma.apiUsage.findFirst({
      where: {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existing) {
      await prisma.apiUsage.update({
        where: { id: existing.id },
        data: {
          units: { increment: 1 },
        },
      });
    } else {
      await prisma.apiUsage.create({
        data: {
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          endpoint: "track",
          units: 1,
        },
      });
    }

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
