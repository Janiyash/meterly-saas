import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import ApiKeysClientB from "./ApiKeysClient";
import ApiKeysClient from "./ApiKeysClient";

export default async function ApiKeysPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [keys, usageRows, subscription] = await Promise.all([
    prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, last4: true, createdAt: true, revokedAt: true },
    }).catch(() => []),
    prisma.usage.findMany({
      where: { userId, date: { gte: monthStart } },
      select: { apiKeyId: true, count: true },
    }).catch(() => []),
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }).catch(() => null),
  ]);

  const usageByKey: Record<string, number> = {};
  for (const row of usageRows) {
    usageByKey[row.apiKeyId] = (usageByKey[row.apiKeyId] ?? 0) + row.count;
  }

  const planLimit = subscription?.plan?.requestLimit ?? 200;

  const serialized = keys.map((k) => ({
    id: k.id,
    last4: k.last4,
    createdAt: k.createdAt.toISOString(),
    revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
    usageThisMonth: usageByKey[k.id] ?? 0,
  }));

  return <ApiKeysClient initialKeys={serialized} planLimit={planLimit} />;
}