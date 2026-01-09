import { prisma } from "@/lib/prisma";

/**
 * Normalize date to start of day (important for unique constraint)
 */
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Increment daily usage for an API key
 */
export async function incrementUsage({
  userId,
  apiKeyId,
}: {
  userId: string;
  apiKeyId: string;
}) {
  const today = startOfDay();

  return prisma.usage.upsert({
    where: {
      apiKeyId_date: {
        apiKeyId,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      apiKeyId,
      date: today,
      count: 1,
    },
  });
}

/**
 * Track a single usage event
 */
export async function trackUsageEvent({
  userId,
  apiKeyId,
  endpoint,
}: {
  userId: string;
  apiKeyId: string;
  endpoint: string;
}) {
  // 1️⃣ store event
  await prisma.usageEvent.create({
    data: {
      userId,
      apiKeyId,
      endpoint,
    },
  });

  // 2️⃣ increment daily usage
  await incrementUsage({ userId, apiKeyId });
}
