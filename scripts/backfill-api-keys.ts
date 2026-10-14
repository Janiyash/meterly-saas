/* =====================================================
   ONE-TIME BACKFILL SCRIPT
   Fixes:
   - ApiKey.encryptedKey
   - ApiKey.last4
   - ApiUsage.userId
   ===================================================== */

// ✅ Alias Node crypto to avoid DOM conflict
const nodeCrypto = require("crypto");

// ✅ CommonJS import to avoid ESM issues
const { prisma } = require("../lib/prisma");

async function main() {
  console.log("🔄 Backfilling ApiKey.encryptedKey + last4...");

  const keys = await prisma.apiKey.findMany({
    where: {
      encryptedKey: null,
    },
  });

  for (const key of keys) {
    // Generate placeholder (NOT real API key)
    const fakeKey = nodeCrypto.randomBytes(32).toString("hex");

    await prisma.apiKey.update({
      where: { id: key.id },
      data: {
        encryptedKey: fakeKey,
        last4: fakeKey.slice(-4),
      },
    });
  }

  console.log(`✅ Updated ${keys.length} ApiKey rows`);

  console.log("🔄 Backfilling ApiUsage.userId...");

  const usages = await prisma.apiUsage.findMany({
    where: {
      userId: null,
    },
  });

  for (const usage of usages) {
    if (!usage.apiKeyId) continue;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: usage.apiKeyId },
    });

    if (!apiKey) continue;

    await prisma.apiUsage.update({
      where: { id: usage.id },
      data: {
        userId: apiKey.userId,
      },
    });
  }

  console.log(`✅ Updated ${usages.length} ApiUsage rows`);
  console.log("🎉 Backfill completed successfully");
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
