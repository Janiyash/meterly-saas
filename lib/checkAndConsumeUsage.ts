import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function checkAndConsumeUsage({
  userId,
  apiKeyId,
  endpoint,
  units = 1,
}: {
  userId: string;
  apiKeyId: string;
  endpoint: string;
  units?: number;
}) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  /* 1️⃣ Get user plan */
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const planName = subscription?.plan?.name ?? "FREE";
  const limit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];

  /* 2️⃣ Upsert usage safely */
  const usage = await prisma.usage.upsert({
    where: {
      apiKeyId_date: {
        apiKeyId,
        date: monthStart,
      },
    },
    update: {
      count: { increment: units },
    },
    create: {
      apiKeyId,
      userId,
      date: monthStart,
      count: units,
    },
  });

  /* 3️⃣ Enforce limit */
  if (limit !== Infinity && usage.count > limit) {
    throw new Error("USAGE_LIMIT_EXCEEDED");
  }

  /* 4️⃣ Store usage event (analytics) */
  await prisma.usageEvent.create({
    data: {
      userId,
      apiKeyId,
      endpoint,
    },
  });

  return usage;
}
