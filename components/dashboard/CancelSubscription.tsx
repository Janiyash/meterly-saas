"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscription({
  planName,
  cancelAtPeriodEnd,
}: {
  planName: string;
  cancelAtPeriodEnd: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callApi(action: "cancel" | "resume") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setConfirmOpen(false);
      setConfirmText("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (planName === "FREE") return null;

  return (
    <div className="cs">
      <style>{`
        /* Quiet "danger zone" card: neutral surface + a slim red accent bar,
           instead of a full red border/background flood. */
        .cs {
          position: relative;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          padding: 18px 20px 18px 22px;
          margin-top: 28px;
          max-width: 560px;
          border-radius: 8px;
        }
        .cs::before {
          content: "";
          position: absolute; left: 0; top: 10px; bottom: 10px;
          width: 3px; border-radius: 2px;
          background: var(--bad);
          opacity: 0.75;
        }

        .cs-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .cs-title { font-size: 12.5px; font-weight: 700; color: var(--ink); letter-spacing: 0.01em; }
        .cs-title-tag {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--bad); background: var(--bad-tint); padding: 2px 7px; border-radius: var(--radius-pill);
        }

        .cs-copy { font-size: 12.5px; color: var(--ink-soft); line-height: 1.6; max-width: 48ch; margin-bottom: 14px; }

        .cs-action-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .cs-btn-ghost {
          background: none; border: 1px solid var(--line-strong);
          color: var(--ink-soft); font-size: 12.5px; font-weight: 600;
          padding: 7px 14px; border-radius: var(--radius-pill); cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .cs-btn-ghost:hover { border-color: var(--bad); color: var(--bad); }

        .cs-btn-solid {
          background: var(--bad); border: none; color: #1a0a0a;
          font-size: 12.5px; font-weight: 700;
          padding: 7px 14px; border-radius: var(--radius-pill); cursor: pointer;
        }
        .cs-btn-solid:disabled { opacity: 0.5; cursor: default; }

        .cs-btn-brass {
          background: var(--brass); border: none; color: #06110c;
          font-size: 12.5px; font-weight: 700;
          padding: 7px 14px; border-radius: var(--radius-pill); cursor: pointer;
        }
        .cs-btn-brass:hover { background: var(--brass-deep); }

        .cs-confirm { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
        .cs-confirm p { font-size: 11.5px; color: var(--ink-faint); margin-bottom: 8px; }
        .cs-confirm input {
          width: 100%; max-width: 220px; background: var(--surface-dim); border: 1px solid var(--line);
          color: var(--ink); font-size: 13px; padding: 7px 10px; outline: none; margin-bottom: 10px;
          border-radius: 4px;
        }
        .cs-confirm input:focus { border-color: var(--bad); }

        .cs-error { font-size: 11.5px; color: var(--bad); margin-top: 8px; }
      `}</style>

      {cancelAtPeriodEnd ? (
        <>
          <div className="cs-head">
            <span className="cs-title">Subscription set to cancel</span>
            <span className="cs-title-tag">Pending</span>
          </div>
          <p className="cs-copy">
            Your <strong>{planName}</strong> plan won't renew — you'll drop to
            Free at the end of this billing cycle. You can resume any time
            before then.
          </p>
          <div className="cs-action-row">
            <button className="cs-btn-brass" onClick={() => callApi("resume")} disabled={loading}>
              {loading ? "Resuming…" : "Resume subscription"}
            </button>
          </div>
          {error && <div className="cs-error">{error}</div>}
        </>
      ) : (
        <>
          <div className="cs-head">
            <span className="cs-title">Cancel subscription</span>
          </div>
          <p className="cs-copy">
            Cancels your <strong>{planName}</strong> plan at the end of the
            current billing cycle. You'll keep access until then, then drop
            to Free — no partial refund for the current cycle.
          </p>

          {!confirmOpen ? (
            <div className="cs-action-row">
              <button className="cs-btn-ghost" onClick={() => setConfirmOpen(true)}>
                Cancel plan
              </button>
            </div>
          ) : (
            <div className="cs-confirm">
              <p>Type CANCEL to confirm.</p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CANCEL"
              />
              <div className="cs-action-row">
                <button
                  className="cs-btn-solid"
                  onClick={() => callApi("cancel")}
                  disabled={confirmText !== "CANCEL" || loading}
                >
                  {loading ? "Cancelling…" : "Confirm cancellation"}
                </button>
                <button
                  className="cs-btn-ghost"
                  onClick={() => { setConfirmOpen(false); setConfirmText(""); }}
                >
                  Keep plan
                </button>
              </div>
              {error && <div className="cs-error">{error}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}