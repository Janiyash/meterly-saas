import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/api-key";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer "))
    return NextResponse.json({ error: "Missing key" }, { status: 401 });

  const rawKey = auth.replace("Bearer ", "");

  const apiKeys = await prisma.apiKey.findMany({
    where: { revokedAt: null },
  });

  const apiKey = apiKeys.find(
    (k) => decrypt(k.encryptedKey) === rawKey
  );

  if (!apiKey)
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  // Increment USER usage (not key-based)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.apiUsage.upsert({
    where: {
      userId_date: {
        userId: apiKey.userId,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      count: 1,
      date: today,
    },
  });

  return NextResponse.json({ success: true });
}
