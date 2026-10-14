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

  // ENTERPRISE = unlimited
  if (limit === Infinity) {
    await prisma.usage.upsert({
      where: {
        apiKeyId_date: {
          apiKeyId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      update: { count: { increment: 1 } },
      create: {
        apiKeyId,
        userId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        count: 1,
      },
    });

    return null;
  }

  const monthStart = getStartOfMonth();

  const result = await prisma.$transaction(async (tx) => {
    // ✅ SUM usage.count (THIS WAS MISSING)
    const usageAgg = await tx.usage.aggregate({
      where: {
        userId,
        date: { gte: monthStart },
      },
      _sum: { count: true },
    });

    const used = usageAgg._sum.count ?? 0;

    if (used >= limit) {
      return "QUOTA_EXCEEDED";
    }

    // ✅ Increment today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await tx.usage.upsert({
      where: {
        apiKeyId_date: {
          apiKeyId,
          date: today,
        },
      },
      update: { count: { increment: 1 } },
      create: {
        apiKeyId,
        userId,
        date: today,
        count: 1,
      },
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

  return null;
}
