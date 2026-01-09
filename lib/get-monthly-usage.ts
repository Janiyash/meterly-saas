import { prisma } from "@/lib/prisma";

export async function getMonthlyUsage(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await prisma.apiUsage.aggregate({
    _sum: { count: true },
    where: {
      apiKey: {
        userId,
      },
      date: {
        gte: startOfMonth,
      },
    },
  });

  return result._sum.count ?? 0;
}
