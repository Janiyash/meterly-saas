import { prisma } from "@/lib/prisma";

export async function cleanupExpiredSubscriptions() {
  await prisma.subscription.updateMany({
    where: {
      currentPeriodEnd: { lt: new Date() },
      cancelAtPeriodEnd: true,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELED",
    },
  });
}
