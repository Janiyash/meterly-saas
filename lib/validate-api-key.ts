import { prisma } from "@/lib/prisma";

export async function validateApiKey(rawKey: string) {
  if (!rawKey) return null;

  return prisma.apiKey.findFirst({
    where: {
      encryptedKey: rawKey, // since you decided to store full key
      revokedAt: null,
    },
  });
}
