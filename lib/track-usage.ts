import { prisma } from "@/lib/prisma";

export async function trackUsage(apiKeyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.apiUsage.upsert({
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
      apiKeyId,
      date: today,
      count: 1,
    },
  });
}
