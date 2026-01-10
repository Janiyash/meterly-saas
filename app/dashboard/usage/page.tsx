import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  /* =========================
     SUBSCRIPTION
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
     API KEYS + USAGE
  ========================= */
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

  const keysWithUsage = keys.map((key) => ({
    id: key.id,
    name: `**** **** **** ${key.last4}`,
    used: key.usages.reduce((s, u) => s + u.count, 0),
  }));

  const totalUsed = keysWithUsage.reduce((s, k) => s + k.used, 0);
  const percent =
    limit === Infinity ? 0 : Math.min((totalUsed / limit) * 100, 100);

  return (
    <div className="usage-page">
      <h1 className="title">Usage</h1>
      <p className="subtitle">Monitor API usage and limits</p>

      {/* USER + PLAN */}
      <div className="grid-2">
        <div className="card">
          <p className="label">Logged in as</p>
          <p className="value">{session.user.email}</p>
        </div>

        <div className="card">
          <p className="label">Current Plan</p>
          <p className="value">{planName}</p>
          <p className="muted">
            Monthly limit: {limit === Infinity ? "Unlimited" : limit}
          </p>
        </div>
      </div>

      {/* TOTAL USAGE */}
      <div className="card">
        <div className="usage-header">
          <span className="muted">Total usage this month</span>
          <span>
            {totalUsed} / {limit === Infinity ? "∞" : limit}
          </span>
        </div>

        <div className="progress">
          <div
            className={`progress-fill ${
              percent < 70 ? "bar green" : percent < 90 ? "bar yellow" : "bar red"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* API TABLE */}
      <div className="table-card">
        <div className="table-header">
          <span>API Key</span>
          <span>Usage</span>
          <span>Status</span>
        </div>

        {keysWithUsage.map((key) => {
          const keyPercent =
            limit === Infinity ? 0 : (key.used / limit) * 100;

          const statusText =
            keyPercent >= 100
              ? "Blocked"
              : keyPercent >= 80
              ? "Near limit"
              : "Healthy";

          const statusColor =
            keyPercent >= 100
              ? "red"
              : keyPercent >= 80
              ? "yellow"
              : "green";

          return (
            <div key={key.id} className="table-row">
              <span className="mono">{key.name}</span>

          <div className="usage-col">
            <span className="usage-text">
              {key.used} / {limit === Infinity ? "∞" : limit}
            </span>

            <div className="row-progress">
              <div
                className={`row-fill ${statusColor}`}
              />
            </div>
          </div>


              <span className={`status ${statusColor}`}>
                {statusText}
              </span>
            </div>
          );
        })}
      </div>

      {/* CSS */}
      <style>{`
        .usage-page {
          padding: 20px 40px;
          color: white;
        }

        .title {
          font-size: 30px;
          margin-bottom: 4px;
        }

        .subtitle {
          color: #9ca3af;
          margin-bottom: 20px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .card {
          background: #0b0b0b;
          border: 1px solid #222;
          border-radius: 16px;
          padding: 18px;
        }

        .label {
          font-size: 13px;
          color: #9ca3af;
        }

        .value {
          font-size: 18px;
          font-weight: 500;
          margin-top: 4px;
        }

        .muted {
          color: #9ca3af;
          font-size: 14px;
        }

        .usage-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress {
          height: 8px;
          background: #1f2937;
          border-radius: 999px;
          overflow: hidden;
          width: 100%;
        }

        .progress-fill {
          height: 100%;
        }

        .table-card {
          margin-top: 22px;
          background: #0b0b0b;
          border: 1px solid #222;
          border-radius: 16px;
          overflow: hidden;
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 280px 1fr 120px; 
          padding: 14px 20px;
          align-items: center;
        }

        .table-header {
          background: #111;
          color: #9ca3af;
          font-size: 14px;
        }

        .table-row {
          border-top: 1px solid #222;
        }

        .mono {
          font-family: monospace;
        }

        .row-progress {
          height: 6px;
          background: #1f2937;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 6px;
          width: 90%;
        }

        .row-fill {
          height: 100%;
        }

        .status {
          font-weight: 500;
          text-align: left;
        }

        /* BAR COLORS */
        .bar.green { background: #22c55e; }
        .bar.yellow { background: #eab308; }
        .bar.red { background: #ef4444; }

        /* STATUS TEXT COLORS */
        .status.green { color: #22c55e; }
        .status.yellow { color: #eab308; }
        .status.red { color: #ef4444; }
        
      `}</style>
    </div>
  );
}
