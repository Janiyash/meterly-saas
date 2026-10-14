"use client";

import Link from "next/link";
import RazorpayButton from "@/components/RazorpayButton";
import TiltCard from "@/components/motion/TiltCard";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";

interface Plan {
  name: string;
  price: number;
  tagline: string;
  features: string[];
}

export default function PricingGrid({
  plans,
  currentPlan,
  hasSession,
}: {
  plans: Plan[];
  currentPlan: string | null;
  hasSession: boolean;
}) {
  return (
    <>
      <style>{`
        .pr-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        @media (max-width: 820px) {
          .pr-grid { grid-template-columns: 1fr; }
        }

        .pr-card {
          padding: 32px 28px;
          border-radius: 0;
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          background: var(--surface);
          position: relative;
          transition: background 0.2s;
        }
        .pr-card:last-child { border-right: none; }
        @media (max-width: 820px) {
          .pr-card { border-right: none; border-bottom: 1px solid var(--line); }
          .pr-card:last-child { border-bottom: none; }
        }

        .pr-card.is-pro {
          background: var(--surface);
          box-shadow: inset 0 0 0 1px var(--brass), 0 0 40px -16px rgba(52, 211, 153, 0.3);
          z-index: 1;
        }

        .pr-card-badge {
          position: absolute;
          top: -1px; left: 50%;
          transform: translateX(-50%);
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: var(--brass);
          color: var(--paper);
          padding: 3px 12px;
          border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        }

        .pr-card-name {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.4px; color: var(--ink-faint);
          margin-bottom: 16px; text-transform: uppercase;
        }
        .pr-card-name.is-pro { color: var(--brass-deep); }

        .pr-card-price {
          font-family: var(--font-mono);
          font-size: 36px; font-weight: 600;
          color: var(--ink); margin-bottom: 6px; line-height: 1;
        }
        .pr-card-price span { font-size: 13px; font-weight: 400; color: var(--ink-faint); }

        .pr-card-tagline {
          font-size: 13px; color: var(--ink-soft);
          line-height: 1.55; margin-bottom: 28px; min-height: 40px;
          border-bottom: 1px solid var(--line); padding-bottom: 20px;
        }

        .pr-card-features { list-style: none; margin: 0 0 32px; padding: 0; flex: 1; }
        .pr-card-features li {
          display: flex; align-items: baseline; gap: 10px;
          font-size: 13px; color: var(--ink-soft);
          padding: 9px 0; border-bottom: 1px solid var(--line);
        }
        .pr-card-features li:last-child { border-bottom: none; }

        .feat-tick {
          width: 14px; height: 14px; flex-shrink: 0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          background: var(--brass-tint); color: var(--brass-deep);
        }

        .pr-card-cta { width: 100%; text-align: center; margin-top: auto; }

        .pr-current-label {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: var(--brass-deep);
          padding: 9px 0; border: 1px solid var(--brass-tint);
          border-radius: var(--radius-sm); background: var(--brass-tint);
        }
        .pr-current-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--brass); flex-shrink: 0;
        }
      `}</style>

      <StaggerGroup className="pr-grid perspective">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          const isFree = plan.name === "FREE";
          const isPro = plan.name === "PRO";

          return (
            <StaggerItem key={plan.name}>
              <TiltCard
                className={`pr-card${isPro ? " is-pro" : ""}`}
                intensity={isPro ? 4 : 6}
              >
                {isPro && <div className="pr-card-badge">Most popular</div>}

                <div className={`pr-card-name${isPro ? " is-pro" : ""}`}>
                  {plan.name}
                </div>

                <div className="pr-card-price">
                  {plan.price === 0 ? "Free" : `\u20B9${plan.price.toLocaleString()}`}
                  {plan.price !== 0 && <span> / month</span>}
                </div>

                <p className="pr-card-tagline">{plan.tagline}</p>

                <ul className="pr-card-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="feat-tick">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="pr-current-label">
                    <span className="pr-current-dot" />
                    Current plan
                  </div>
                ) : isFree ? (
                  <Link
                    href={hasSession ? "/dashboard" : "/auth/signin"}
                    className="btn btn-line pr-card-cta"
                  >
                    {hasSession ? "Go to dashboard" : "Start for free"}
                  </Link>
                ) : hasSession ? (
                  <RazorpayButton
                    plan={plan.name as "PRO" | "ENTERPRISE"}
                    className="btn btn-brass btn-glow pr-card-cta"
                    label={`Upgrade to ${plan.name}`}
                  />
                ) : (
                  <Link href="/auth/signin" className="btn btn-brass btn-glow pr-card-cta">
                    Sign in to upgrade
                  </Link>
                )}
              </TiltCard>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </>
  );
}