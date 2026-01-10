import { PLAN_LIMITS } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

function getStartOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function checkAndConsumeUsage(
  userId: string,
  apiKeyId: string,
  planName: keyof typeof PLAN_LIMITS
) {
  const limit = PLAN_LIMITS[planName];

  // ✅ ENTERPRISE: no quota enforcement
  if (limit === Infinity) {
    await prisma.usage.create({
      data: { userId, apiKeyId },
    });
    return null;
  }

  const monthStart = getStartOfMonth();

  // ✅ TRANSACTION = SAFE UNDER CONCURRENCY
  const result = await prisma.$transaction(async (tx) => {
    const usageCount = await tx.usage.count({
      where: {
        userId,
        date: { gte: monthStart }, // ✅ FIXED
      },
    });

    if (usageCount >= limit) {
      return "QUOTA_EXCEEDED";
    }

    await tx.usage.create({
      data: { userId, apiKeyId },
    });

    return "OK";
  });

  if (result === "QUOTA_EXCEEDED") {
    return new Response(
      JSON.stringify({
        error: "Monthly quota exceeded",
        plan: planName,
        limit,
      }),
      { status: 429 }
    );
  }

  return null; // ✅ allowed
}
