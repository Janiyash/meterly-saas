import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RazorpayButton from "@/components/RazorpayButton";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import UsageRing from "@/components/dashboard/UsageRing";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const subscription = await prisma.subscription
    .findUnique({ where: { userId }, include: { plan: true } })
    .catch(() => null);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usageAgg = await prisma.usage
    .aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { count: true } })
    .catch(() => ({ _sum: { count: 0 } }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyUsage = await prisma.usage
    .findMany({ where: { userId, date: { gte: sevenDaysAgo } }, orderBy: { date: "asc" } })
    .catch(() => []);

  const apiKeyCount = await prisma.apiKey
    .count({ where: { userId, revokedAt: null } })
    .catch(() => 0);

  const used = usageAgg._sum.count ?? 0;
  const planName = subscription?.plan?.name ?? "FREE";
  const limit = planName === "ENTERPRISE" ? Infinity : (subscription?.plan?.requestLimit ?? 200);
  const billingPrice = subscription?.plan?.price ?? 0;
  const status = subscription?.status ?? "INACTIVE";

  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const row = dailyUsage.find(
      (r) => new Date(r.date).toDateString() === d.toDateString()
    );
    days.push({ label, count: row?.count ?? 0 });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);
  const sparkPoints = days
    .map((d, i) => `${(i / 6) * 100},${100 - (d.count / maxDay) * 100}`)
    .join(" ");

  const quickActions = [
    { href: "/dashboard/text-analysis", name: "Text analysis", desc: "Run a document through the analyzer" },
    { href: "/dashboard/text-analysis/history", name: "Analysis history", desc: "Revisit past runs" },
    { href: "/dashboard/usage", name: "Usage report", desc: "Per-key request history" },
    { href: "/dashboard/api-keys", name: "API keys", desc: "Generate or revoke keys" },
    { href: "/dashboard/billing", name: "Billing history", desc: "Past payments and receipts" },
    { href: "/dashboard/settings", name: "Settings", desc: "Profile and account" },
  ];

  return (
    <div className="db">
      <style>{`
        .db { display: flex; flex-direction: column; gap: 8px; }

        .db-focal {
          display: flex; align-items: center; gap: 44px;
          padding: 20px 0 44px;
          border-bottom: 1px solid var(--line-strong);
          flex-wrap: wrap;
        }
        .db-focal-info { flex: 1; min-width: 260px; }
        .db-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .db-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(28px, 3.4vw, 40px); color: var(--ink); line-height: 1.05; margin-bottom: 8px;
        }
        .db-sub { font-size: 14px; color: var(--ink-soft); margin-bottom: 22px; }
        .db-sub strong { color: var(--ink); font-weight: 600; }

        .db-focal-stats {
          display: flex; align-items: center; gap: 22px; flex-wrap: wrap;
          padding: 18px 0; margin-bottom: 22px;
          border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
        }
        .db-focal-stat { display: flex; flex-direction: column; gap: 5px; }
        .db-focal-stat-label { font-size: 11px; color: var(--ink-faint); }
        .db-focal-stat-value { font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: var(--ink); }

        .db-head-actions { display: flex; gap: 10px; flex-shrink: 0; }

        @media (max-width: 640px) { .db-focal { justify-content: center; text-align: center; } .db-focal-stats { justify-content: center; } .db-head-actions { justify-content: center; width: 100%; } }

        .db-main { display: grid; grid-template-columns: 1fr 360px; gap: 0; margin-top: 40px; }
        @media (max-width: 960px) { .db-main { grid-template-columns: 1fr; } }

        .db-panel-title {
          font-size: 12px; font-weight: 700; letter-spacing: 0.3px;
          color: var(--ink-faint); padding-bottom: 14px; border-bottom: 1px solid var(--line-strong);
          display: flex; justify-content: space-between; align-items: baseline;
        }
        .db-panel-title a { font-size: 12px; font-weight: 600; color: var(--brass-deep); text-decoration: none; }
        .db-panel-title a:hover { text-decoration: underline; }

        .db-usage { padding-right: 40px; border-right: 1px solid var(--line); }
        @media (max-width: 960px) { .db-usage { border-right: none; padding-right: 0; padding-bottom: 40px; } }

        .db-spark-title { font-size: 11px; color: var(--ink-faint); margin-bottom: 12px; }
        .db-spark-wrap { height: 56px; }
        .db-spark-wrap svg { width: 100%; height: 100%; overflow: visible; }
        .db-spark-days { display: flex; justify-content: space-between; margin-top: 8px; }
        .db-spark-day { font-size: 10px; color: var(--ink-faint); }

        .db-right { padding-left: 40px; display: flex; flex-direction: column; gap: 36px; }
        @media (max-width: 960px) { .db-right { padding-left: 0; } }

        .db-plan-row { display: flex; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid var(--line); }
        .db-plan-row:first-of-type { padding-top: 18px; }
        .db-plan-key { font-size: 13px; color: var(--ink-faint); }
        .db-plan-val { font-size: 13px; font-weight: 600; color: var(--ink); }

        .db-upgrade { display: block; width: 100%; margin-top: 18px; text-align: center; }

        .db-actions { padding-top: 6px; }
        .db-action-row {
          display: flex; align-items: baseline; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid var(--line); text-decoration: none;
          gap: 12px;
        }
        .db-action-row:last-child { border-bottom: none; }
        .db-action-name { font-size: 14px; font-weight: 700; color: var(--ink); }
        .db-action-desc { font-size: 12px; color: var(--ink-faint); }
      `}</style>

      <Reveal>
      <section className="db-focal">
        <UsageRing
          used={used}
          limit={limit === Infinity ? 999999999 : limit}
          planName={planName}
        />
        <div className="db-focal-info">
          <div className="db-kicker">Account overview</div>
          <h1 className="db-title">{session!.user?.name?.split(" ")[0] ?? "Dashboard"}</h1>
          <p className="db-sub">
            Signed in as <strong>{session!.user?.email}</strong>
          </p>

          <div className="db-focal-stats">
            <div className="db-focal-stat">
              <span className="db-focal-stat-label">Subscription</span>
              <span className={`pill ${status === "ACTIVE" ? "pill-good" : "pill-quiet"}`}>
                <span className="pill-dot" /> {status}
              </span>
            </div>
            <span className="tick" style={{ height: 28 }} />
            <div className="db-focal-stat">
              <span className="db-focal-stat-label">Active API keys</span>
              <span className="db-focal-stat-value reading"><Counter value={apiKeyCount} /></span>
            </div>
            <span className="tick" style={{ height: 28 }} />
            <div className="db-focal-stat">
              <span className="db-focal-stat-label">Billing</span>
              <span className="db-focal-stat-value">{billingPrice === 0 ? "Free" : `₹${billingPrice}/mo`}</span>
            </div>
          </div>

          <div className="db-head-actions">
            <Link href="/dashboard/api-keys" className="btn btn-line">API keys</Link>
            <Link href="/dashboard/text-analysis" className="btn btn-brass btn-glow">Try analysis</Link>
          </div>
        </div>
      </section>
      </Reveal>

      <Reveal delay={0.1}>
      <div className="db-main">
        <div className="db-usage">
          <div className="db-panel-title">
            Usage trend
            <Link href="/dashboard/usage">Full report</Link>
          </div>

          <div className="db-spark-title" style={{ marginTop: 22 }}>Last 7 days</div>
          <div className="db-spark-wrap">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={sparkPoints}
                fill="none"
                stroke="var(--brass)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="db-spark-days">
            {days.map((d, i) => (
              <span key={`${d.label}-${i}`} className="db-spark-day">{d.label}</span>
            ))}
          </div>
        </div>

        <div className="db-right">
          <div>
            <div className="db-panel-title">
              Plan &amp; billing
              <Link href="/dashboard/billing">History</Link>
            </div>
            <div className="db-plan-row">
              <span className="db-plan-key">Plan</span>
              <span className="db-plan-val">{planName}</span>
            </div>
            <div className="db-plan-row">
              <span className="db-plan-key">Status</span>
              <span className="db-plan-val" style={{ color: status === "ACTIVE" ? "var(--good)" : "var(--ink-faint)" }}>
                {status}
              </span>
            </div>
            <div className="db-plan-row">
              <span className="db-plan-key">Billing</span>
              <span className="db-plan-val">{billingPrice === 0 ? "Free" : `₹${billingPrice} / month`}</span>
            </div>
            <div className="db-plan-row" style={{ borderBottom: "none" }}>
              <span className="db-plan-key">Request limit</span>
              <span className="db-plan-val">{limit === Infinity ? "Unlimited" : `${limit.toLocaleString()} / mo`}</span>
            </div>

            {planName !== "ENTERPRISE" && (
              <RazorpayButton
                plan="ENTERPRISE"
                className="btn btn-line db-upgrade"
                label="Upgrade to Enterprise"
              />
            )}
          </div>

          <div>
            <div className="db-panel-title">Quick actions</div>
            <StaggerGroup className="db-actions">
              {quickActions.map((a) => (
                <StaggerItem key={a.href}>
                  <Link href={a.href} className="db-action-row">
                    <span className="db-action-name">{a.name}</span>
                    <span className="db-action-desc">{a.desc}</span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </div>
      </Reveal>
    </div>
  );
}
