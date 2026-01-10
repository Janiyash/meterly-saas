import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 🔹 subscription
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const planName = subscription?.plan?.name ?? "FREE";
  const limit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];

  // 🔹 start of month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // 🔹 usage per API key
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      last4: true,
      usages: {
        where: { date: { gte: monthStart } },
        select: { count: true },
      },
    },
  });

  const formattedKeys = keys.map((k) => ({
    id: k.id,
    name: `**** **** **** ${k.last4}`,
    used: k.usages.reduce((s, u) => s + u.count, 0),
  }));

  return NextResponse.json({
    plan: planName,
    limit,
    keys: formattedKeys,
  });
}
