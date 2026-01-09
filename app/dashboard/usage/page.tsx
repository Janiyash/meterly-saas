import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const planName = subscription?.plan?.name ?? "FREE";
  const limit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      last4: true,
      usages: {
        where: {
          date: { gte: monthStart },
        },
        select: { count: true },
      },
    },
  });

  const keysWithUsage = keys.map((key) => ({
    id: key.id,
    name: `**** **** **** ${key.last4}`,
    used: key.usages.reduce((sum, u) => sum + u.count, 0),
  }));

  const totalUsed = keysWithUsage.reduce((s, k) => s + k.used, 0);
  const percent =
    limit === Infinity ? 0 : Math.min((totalUsed / limit) * 100, 100);

  return (
    <div className="p-8 text-white space-y-8">
      {/* ✅ PAGE HEADER */}

      {/* 👤 USER + PLAN INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-5">
          <p className="text-sm text-gray-400">Logged in as</p>
          <p className="text-lg font-medium">{session.user.email}</p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5">
          <p className="text-sm text-gray-400">Current Plan</p>
          <p className="text-lg font-medium">{planName}</p>
          <p className="text-sm text-gray-400 mt-1">
            Monthly limit: {limit === Infinity ? "Unlimited" : limit}
          </p>
        </div>
      </div>

      {/* 📊 TOTAL USAGE */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">
            Total usage this month
          </span>
          <span className="text-sm">
            {totalUsed} / {limit === Infinity ? "∞" : limit}
          </span>
        </div>

        <div className="h-3 bg-[#222] rounded-full overflow-hidden">
          <div
            className={`h-full ${
              percent < 70
                ? "bg-green-500"
                : percent < 90
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 🔑 API KEY TABLE */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#181818] text-gray-400 text-sm">
            <tr>
              <th className="text-left p-4">API Key</th>
              <th className="text-left p-4">Usage</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {keysWithUsage.map((key) => {
              const keyPercent =
                limit === Infinity ? 0 : (key.used / limit) * 100;

              return (
                <tr
                  key={key.id}
                  className="border-t border-[#222] hover:bg-[#151515]"
                >
                  <td className="p-4">{key.name}</td>

                  <td className="p-4">
                    {key.used} / {limit === Infinity ? "∞" : limit}
                    <div className="h-2 bg-[#222] rounded-full mt-2">
                      <div
                        className={`h-full rounded-full ${
                          keyPercent < 70
                            ? "bg-green-500"
                            : keyPercent < 90
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${keyPercent}%` }}
                      />
                    </div>
                  </td>

                  <td className="p-4">
                    {keyPercent >= 100 ? (
                      <span className="text-red-500">Blocked</span>
                    ) : keyPercent >= 80 ? (
                      <span className="text-yellow-500">Near limit</span>
                    ) : (
                      <span className="text-green-500">Healthy</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
