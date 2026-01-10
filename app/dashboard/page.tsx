import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import RazorpayButton from "@/components/RazorpayButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  /* =========================
     SUBSCRIPTION + PLAN
  ========================= */
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const planName = subscription?.plan?.name ?? "FREE";
  const limit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS];

  /* =========================
     MONTH START
  ========================= */
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  /* =========================
     MONTHLY USAGE
  ========================= */
  const monthlyUsage = await prisma.usage.aggregate({
    where: {
      userId,
      date: { gte: monthStart },
    },
    _sum: { count: true },
  });

  const totalUsage = monthlyUsage._sum.count ?? 0;
  const usagePercent =
    limit === Infinity
      ? 0
      : Math.min(Math.round((totalUsage / limit) * 100), 100);

  /* =========================
     WEEKLY USAGE
  ========================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeklyUsage: { day: string; value: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayLabel = dayStart.toLocaleDateString("en-US", {
      weekday: "short",
    });

    const usage = await prisma.usage.aggregate({
      where: {
        userId,
        date: { gte: dayStart, lt: dayEnd },
      },
      _sum: { count: true },
    });

    weeklyUsage.push({
      day: dayLabel,
      value: usage._sum.count ?? 0,
    });
  }

  const maxWeekly = Math.max(...weeklyUsage.map((d) => d.value), 1);

  /* =========================
     RENDER
  ========================= */
  return (
    <main className="dashboard">
      <h1>Account Overview</h1>
      <p className="subtext">
        Monitor your usage, subscription status, and recent activity.
      </p>
      <p className="subtext">
        Welcome, <strong>{session.user.email}</strong>
      </p>

      {/* TOP CARDS */}
      <div className="grid-3">
        <Card title="Current Plan" value={planName} />
        <Card title="Status" value={subscription?.status ?? "ACTIVE"} />
        <Card
          title="Billing"
          value={
            planName === "FREE"
              ? "₹0 / month"
              : planName === "PRO"
              ? "₹999 / month"
              : "₹4,999 / month"
          }
        />
      </div>


  {/* ===== MONTHLY USAGE + DONUT (SIDE BY SIDE) ===== */}
      <div className="grid-2">
        {/* MONTHLY USAGE */}
        <div className="monthly-usage-card">
          <h3>Monthly Usage</h3>
          <p className="monthly-subtext">
            {totalUsage} of {limit === Infinity ? "∞" : limit} requests used
          </p>

          <div className="monthly-progress">
            <div
              className="monthly-progress-fill"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

  {planName === "FREE" && <RazorpayButton plan="PRO" />}
  {planName === "PRO" && <RazorpayButton plan="ENTERPRISE" />}

        </div>

        {/* USAGE DISTRIBUTION */}
        <div className="card">
          <h3>Usage Distribution</h3>
          <svg viewBox="0 0 36 36" className="donut">
            <path
              className="donut-bg"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="donut-fill"
              strokeDasharray={`${usagePercent} ${100 - usagePercent}`}
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" className="donut-text">
              {usagePercent}%
            </text>
          </svg>
        </div>
      </div>
      {/* GRAPHS */}
      <div className="grid-2">
        {/* LINE */}
        <div className="card">
          <h3>Usage Trend</h3>
          <svg viewBox="0 0 300 160" className="linechart">
            <polyline
              points={weeklyUsage
                .map((d, i) => {
                  const x = (i / 6) * 260 + 20;
                  const y = 100 - (d.value / maxWeekly) * 70;
                  return `${x},${y}`;
                })
                .join(" ")}
            />

            {weeklyUsage.map((d, i) => {
              const x = (i / 6) * 260 + 20;
              const y = 100 - (d.value / maxWeekly) * 70;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#22c55e" />
                  <text
                    x={x}
                    y={y - 8}
                    fontSize="10"
                    fill="#9ca3af"
                    textAnchor="middle"
                  >
                    {d.value}
                  </text>
                </g>
              );
            })}

            {weeklyUsage.map((d, i) => {
              const x = (i / 6) * 260 + 20;
              return (
                <text
                  key={i}
                  x={x}
                  y={140}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {d.day}
                </text>
              );
            })}
          </svg>
          <p className="muted">API requests per day (Last 7 days)</p>
        </div>

        {/* BAR */}
        <div className="card">
          <h3>Weekly Activity</h3>
          <svg viewBox="0 0 240 130" className="barchart">
            {weeklyUsage.map((d, i) => {
              const h = (d.value / maxWeekly) * 90;
              return (
                <g key={i}>
                  <rect
                    x={i * 32}
                    y={110 - h}
                    width="20"
                    height={h}
                    rx="4"
                    fill="#22c55e"
                  />
                  <text
                    x={i * 32 + 10}
                    y={110 - h - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#9ca3af"
                  >
                    {d.value}
                  </text>
                  <text
                    x={i * 32 + 10}
                    y={125}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#9ca3af"
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* STYLES */}
       <style>{`
        .dashboard {
          background: #0b0b0b;
          min-height: 100vh;
          padding: 40px;
          color: white;
        }
        h1 {
          font-size: 32px;
        }
        .subtext {
          color: #9ca3af;
          margin-bottom: 20px;
        }
        .grid-3,
        .grid-2 {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
        }
        .grid-3 {
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .grid-2 {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .card {
          background: #111;
          border: 1px solid #222;
          border-radius: 14px;
          padding: 20px;
          
        }
        .muted {
          color: #9ca3af;
          font-size: 14px;
        }
        .linechart polyline {
          fill: none;
          stroke: #22c55e;
          stroke-width: 3;
        }
        .donut {
          width: 160px;
          margin: auto;
          padding-left: 280px;
        }
        .donut-bg {
          stroke: #1f2937;
          stroke-width: 3.8;
          fill: none;
        }
        .donut-fill {
          stroke: #22c55e;
          stroke-width: 3.8;
          fill: none;
          stroke-linecap: round;
        }
        .donut-text {
          fill: white;
          font-size: 6px;
          text-anchor: middle;
        }

        .monthly-usage-card {
          background: linear-gradient(180deg, #0d0d0d, #080808);
          border: 1px solid #1f2937;
          border-radius: 18px;
          padding: 24px;
        }
        .monthly-subtext {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 14px;
        }
        .monthly-progress {
          width: 100%;
          height: 8px;
          background: #1f2937;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .monthly-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #15803d, #4ade80);
          
        }
        .monthly-upgrade-btn {
          background: #ffffff;
          color: #000;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
      `}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__USER_ID__ = "${session.user.id}";`,
        }}
      />

    </main>
  );
}

/* =========================
   CARD COMPONENT
========================= */
function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="card">
      <p className="muted">{title}</p>
      <p style={{ fontSize: "22px", fontWeight: "bold", marginTop: "6px" }}>
        {value}
      </p>
    </div>
  );
}
