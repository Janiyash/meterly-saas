import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/api-key";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const key = await prisma.apiKey.findFirst({
    where: {
      userId: session.user.id,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!key) {
    return NextResponse.json(
      { error: "No API key found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    apiKey: decrypt(key.encryptedKey),
  });
}
