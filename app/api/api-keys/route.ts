import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// =====================
// GET API KEY
// =====================
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ apiKey: "" });
  }

  const key = await prisma.apiKey.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    apiKey: key?.encryptedKey ?? "",
  });
}

// =====================
// REGENERATE API KEY
// =====================
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // revoke old
  await prisma.apiKey.updateMany({
    where: { userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const rawKey =
    "meterly_" + crypto.randomBytes(32).toString("hex");

  const newKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      encryptedKey: rawKey,
      last4: rawKey.slice(-4),
    },
  });

  return NextResponse.json({
    apiKey: newKey.encryptedKey,
    last4: newKey.last4,
  });
}
