import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/api-key";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing key" },
      { status: 401 }
    );
  }

  const rawKey = auth.replace("Bearer ", "");

  const apiKeys = await prisma.apiKey.findMany({
    where: { revokedAt: null },
  });

  const apiKey = apiKeys.find(
    (k) => decrypt(k.encryptedKey).toString() === rawKey
  );

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid key" },
      { status: 401 }
    );
  }

  /* =========================
     INCREMENT USER USAGE
  ========================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.usage.upsert({
    where: {
      apiKeyId_date: {
        apiKeyId: apiKey.id,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      apiKeyId: apiKey.id,
      userId: apiKey.userId,
      date: today,
      count: 1,
    },
  });

  return NextResponse.json({ success: true });
}
