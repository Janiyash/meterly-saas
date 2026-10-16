import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateRawApiKey, encrypt } from "@/lib/api-key";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;

  try {
    const rawKey = generateRawApiKey();
    const encryptedKey = encrypt(rawKey);
    const last4 = rawKey.slice(-4);

    const record = await prisma.apiKey.create({
      data: { userId, encryptedKey, last4 },
    });

    return NextResponse.json({ id: record.id, key: rawKey, last4 });
  } catch (err) {
    console.error("POST /api/api-keys failed:", err);
    return NextResponse.json(
      // TEMPORARY DEBUG: remove after the issue is found
      {
        error:
          "DEBUG: " +
          (err instanceof Error ? err.message : String(err)).slice(0, 400) +
          " | DB host: " +
          (() => {
            try {
              const u = new URL(process.env.DATABASE_URL || "");
              return u.host + u.pathname + (u.searchParams.get("schema") ? " schema=" + u.searchParams.get("schema") : "");
            } catch {
              return "DATABASE_URL missing/invalid";
            }
          })(),
      },
      { status: 500 }
    );
  }
}
