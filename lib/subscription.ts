import { prisma } from "@/lib/prisma";

export async function ensureFreeSubscription(
  userId: string,
  email?: string
) {
  /* 1️⃣ Ensure USER exists */
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email,
      role: "USER", // ✅ NOW VALID
    },
  });

  /* 2️⃣ Ensure FREE plan exists */
  let freePlan = await prisma.plan.findFirst({
    where: { name: "FREE" },
  });

  if (!freePlan) {
    freePlan = await prisma.plan.create({
      data: {
        name: "FREE",
        price: 0,
        interval: "monthly",
      },
    });
  }

  /* 3️⃣ Ensure subscription exists */
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: "active",
      },
    });
  }

  return freePlan;
}
