import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRawApiKey, encrypt } from "@/lib/api-key";

/**
 * Gives a user their free default API key, but only if they have never had
 * any key. If they revoked all keys on purpose, we do NOT silently create a
 * new one (they must generate it themselves).
 * Errors are logged (never swallowed silently) and never thrown.
 */
export async function ensureDefaultKey(userId: string): Promise<void> {
  try {
    const total = await prisma.apiKey.count({ where: { userId } });
    if (total > 0) return;

    const rawKey = generateRawApiKey();
    await prisma.apiKey.create({
      data: {
        userId,
        name: "Default key",
        encryptedKey: encrypt(rawKey),
        last4: rawKey.slice(-4),
      },
    });
  } catch (err) {
    console.error("ensureDefaultKey failed:", err);
  }
}

/** The user's oldest non-revoked key, or null. */
export async function getActiveKey(userId: string) {
  try {
    return await prisma.apiKey.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    console.error("getActiveKey failed:", err);
    return null;
  }
}

/** Standard response when a user has no active API key. */
export function noKeyResponse() {
  return NextResponse.json(
    {
      code: "NO_API_KEY",
      error:
        "No active API key found. Generate an API key from the API Keys page to run analyses.",
    },
    { status: 403 }
  );
}
