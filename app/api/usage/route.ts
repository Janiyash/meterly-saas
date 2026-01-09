import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // 🔹 get subscription
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
  const usage = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          usage: {
            where: {
              createdAt: { gte: monthStart },
            },
          },
        },
      },
    },
  });

  return Response.json({
    plan: planName,
    limit,
    keys: usage.map((k) => ({
      id: k.id,
      name: k.name,
      used: k._count.usage,
    })),
  });
}
