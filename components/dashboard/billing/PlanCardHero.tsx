"use client";

import { useState } from "react";

export default function PlanCardHero({
  planName,
  renewalDate,
  cancelAtPeriodEnd,
  onCancel,
  onResume,
  /** Anchor id to scroll to when no onCancel/onResume handler is supplied.
   *  Lets a Server Component render this without passing a client closure. */
  cancelSectionId = "cancel-subscription",
}: {
  planName: string;
  renewalDate: string; // already formatted, e.g. "Oct 24, 2026"
  cancelAtPeriodEnd: boolean;
  onCancel?: () => void | Promise<void>;
  onResume?: () => void | Promise<void>;
  cancelSectionId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const hasHandler = cancelAtPeriodEnd ? !!onResume : !!onCancel;
  const label = busy ? "…" : cancelAtPeriodEnd ? "Resume plan" : "Cancel plan";

  return (
    <div className="plan-hero">
      <div className="plan-hero-left">
        <span className="plan-hero-status">
          <span className={`plan-hero-dot ${cancelAtPeriodEnd ? "dot-warn" : "dot-live"}`} />
          {cancelAtPeriodEnd ? "Cancels at period end" : "Active"}
        </span>
        <h2 className="plan-hero-name">{planName}</h2>
      </div>

      <div className="plan-hero-right">
        <div className="plan-hero-meta">
          <span className="plan-hero-meta-label">
            {cancelAtPeriodEnd ? "Access ends" : "Renews"}
          </span>
          <span className="plan-hero-meta-value">{renewalDate}</span>
        </div>

        {hasHandler ? (
          <button
            className="plan-hero-action"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await (cancelAtPeriodEnd ? onResume?.() : onCancel?.());
              } finally {
                setBusy(false);
              }
            }}
          >
            {label}
          </button>
        ) : (
          // No handler passed (e.g. rendered directly from a Server Component) —
          // falls back to a plain anchor that scrolls to the cancel/resume section.
          <a className="plan-hero-action" href={`#${cancelSectionId}`}>
            {label}
          </a>
        )}
      </div>

      <style>{`
        .plan-hero {
          display: flex; justify-content: space-between; align-items: center;
          gap: 24px; flex-wrap: wrap;
          padding: 32px 36px;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          position: relative; overflow: hidden;
        }
        .plan-hero::before {
          content: ""; position: absolute; top: -50px; right: -50px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.07), transparent 70%);
          pointer-events: none;
        }
        .plan-hero-left { display: flex; flex-direction: column; gap: 8px; }
        .plan-hero-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-faint);
        }
        .plan-hero-dot { width: 6px; height: 6px; border-radius: 50%; }
        .dot-live { background: var(--brass); animation: phdot 1.6s ease-in-out infinite; }
        .dot-warn { background: #fbbf24; }
        @keyframes phdot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .plan-hero-name {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(28px, 4vw, 40px); color: var(--ink); line-height: 1;
        }

        .plan-hero-right {
          display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
        }
        .plan-hero-meta { display: flex; flex-direction: column; gap: 4px; text-align: right; }
        .plan-hero-meta-label { font-size: 11px; color: var(--ink-faint); }
        .plan-hero-meta-value { font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: var(--ink); }

        .plan-hero-action {
          background: none; border: 1px solid var(--line-strong);
          color: var(--ink-soft); font-size: 13px; font-weight: 600;
          padding: 9px 18px; border-radius: var(--radius-pill); cursor: pointer;
          text-decoration: none; display: inline-flex; align-items: center;
          transition: border-color 0.15s, color 0.15s;
        }
        .plan-hero-action:hover { border-color: var(--bad); color: var(--bad); }
        .plan-hero-action:disabled { opacity: 0.5; cursor: default; }

        @media (max-width: 640px) {
          .plan-hero { padding: 24px 20px; }
          .plan-hero-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}