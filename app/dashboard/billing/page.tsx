import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import CancelSubscription from "@/components/dashboard/CancelSubscription";

import PlanCardHero from "@/components/dashboard/billing/PlanCardHero";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const payments = await prisma.payment
    .findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    .catch(() => []);

  const subscription = await prisma.subscription
    .findUnique({ where: { userId }, include: { plan: true } })
    .catch(() => null);

  const planName = subscription?.plan?.name ?? "FREE";
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;
  const renewsAt = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : planName === "FREE"
    ? "—"
    : "End of cycle";

  // No reformatting needed for the table — dates/amounts are formatted inline in JSX below.

  return (
    <div>
      <style>{`
        .bl-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .bl-head-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
        .bl-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px;
        }
        .bl-sub { font-size: 14px; color: var(--ink-soft); }

        .bl-section { margin-bottom: 36px; }
        .bl-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-faint); margin-bottom: 12px;
        }

        .bl-table { border-top: 1px solid var(--line); }
        .bl-header {
          display: grid; grid-template-columns: 120px 1fr 110px 120px 140px;
          padding: 10px 4px; border-bottom: 1px solid var(--line-strong);
          font-size: 11px; font-weight: 700; color: var(--ink-faint);
        }
        .bl-row {
          display: grid; grid-template-columns: 120px 1fr 110px 120px 140px;
          padding: 13px 4px; border-bottom: 1px solid var(--line); font-size: 13px; align-items: center;
        }
        .bl-row:last-child { border-bottom: none; }
        .bl-date { color: var(--ink-faint); font-size: 12px; }
        .bl-plan { font-weight: 700; color: var(--ink); }
        .bl-amount { font-family: var(--font-mono); font-weight: 600; color: var(--ink); }
        .bl-id { font-family: var(--font-mono); font-size: 11px; color: var(--ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bl-empty { padding: 40px 4px; text-align: center; color: var(--ink-faint); font-size: 14px; }

        @media (max-width: 760px) {
          .bl-header, .bl-row { grid-template-columns: 90px 1fr 90px 90px; }
          .bl-header span:nth-child(5), .bl-row .bl-id { display: none; }
        }
      `}</style>

      <Reveal>
        <div className="bl-head-row">
          <div>
            <div className="bl-kicker">Billing</div>
            <h1 className="bl-title">Payment history</h1>
            <p className="bl-sub">Every successful upgrade payment made on this account.</p>
          </div>
          <Link href="/pricing" className="btn btn-line">View plans</Link>
        </div>
      </Reveal>

      <div className="bl-section">
        {/* No onCancel/onResume passed — this page is a Server Component,
            so it can't hand a client-side closure down as a prop.
            PlanCardHero falls back to an anchor link to #cancel-subscription. */}
        <PlanCardHero
          planName={planName}
          renewalDate={renewsAt}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </div>

      <div className="bl-section">
        <div className="bl-section-label">Payment history</div>
        <div className="bl-table">
          <div className="bl-header">
            <span>Date</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Payment ID</span>
          </div>
          {payments.length === 0 ? (
            <div className="bl-empty">No payments yet — upgrades will show up here.</div>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="bl-row">
                <span className="bl-date">
                  {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="bl-plan">{p.plan}</span>
                <span className="bl-amount">₹{(p.amount / 100).toLocaleString()}</span>
                <span>
                  <span className={`pill ${p.status === "SUCCESS" ? "pill-good" : "pill-bad"}`}>
                    <span className="pill-dot" /> {p.status}
                  </span>
                </span>
                <span className="bl-id">{p.razorpayPaymentId}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div id="cancel-subscription">
        <CancelSubscription planName={planName} cancelAtPeriodEnd={cancelAtPeriodEnd} />
      </div>
    </div>
  );
}