// app/dashboard/usage/page.tsx  (Variant A — Calendar Heatmap)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import UsageHeatmap from "@/components/usage/UsageHeatmap";

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [usageRows, subscription] = await Promise.all([
    prisma.usage.findMany({
      where: { userId, date: { gte: monthStart } },
      include: { apiKey: { select: { last4: true } } },
      orderBy: { date: "asc" },
    }).catch(() => []),
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }).catch(() => null),
  ]);

  const totalUsed = usageRows.reduce((acc, r) => acc + r.count, 0);
  const planLimit = subscription?.plan?.requestLimit ?? 200;
  const planName = subscription?.plan?.name ?? "FREE";
  const pct = Math.min((totalUsed / planLimit) * 100, 100);

  // Build day→count map for the heatmap
  const dayMap: Record<string, { count: number; keys: string[] }> = {};
  for (const row of usageRows) {
    const key = new Date(row.date).toISOString().slice(0, 10);
    if (!dayMap[key]) dayMap[key] = { count: 0, keys: [] };
    dayMap[key].count += row.count;
    dayMap[key].keys.push(row.apiKey.last4);
  }

  return (
    <div className="up">
      <style>{`
        .up-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .up-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px;
        }
        .up-sub { font-size: 14px; color: var(--ink-soft); margin-bottom: 32px; }
        .up-summary { border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 26px 4px; margin-bottom: 36px; }
        .up-summary-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; padding: 0 24px; }
        .up-big { font-family: var(--font-mono); font-size: 38px; font-weight: 600; color: var(--ink); }
        .up-big span { font-size: 18px; color: var(--ink-faint); font-weight: 400; }
        .up-bar-bg { height: 6px; background: var(--line); overflow: hidden; margin: 0 24px; }
        .up-bar-fill { height: 100%; background: var(--brass); transition: width 0.5s ease; }
        .up-bar-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--ink-faint); margin: 8px 24px 0; }
      `}</style>

      <Reveal>
        <div className="up-kicker">Usage report</div>
        <h1 className="up-title">Requests this period</h1>
        <p className="up-sub">Your API request usage for the current billing period.</p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="up-summary">
          <div className="up-summary-row">
            <div className="up-big">
              <Counter value={totalUsed} />
              <span> / {planLimit.toLocaleString()}</span>
            </div>
            <span className="pill pill-brass">{planName}</span>
          </div>
          <div className="up-bar-bg">
            <div className="up-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="up-bar-labels">
            <span>{pct.toFixed(1)}% used</span>
            <span>{(planLimit - totalUsed).toLocaleString()} remaining</span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <UsageHeatmap dayMap={dayMap} />
      </Reveal>
    </div>
  );
}