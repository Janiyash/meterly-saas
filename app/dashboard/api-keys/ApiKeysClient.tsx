"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ApiKey {
  id: string;
  last4: string;
  createdAt: string;
  revokedAt: string | null;
  usageThisMonth: number;
}

export default function ApiKeysClient({
  initialKeys,
  planLimit,
}: {
  initialKeys: ApiKey[];
  planLimit: number;
}) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch("/api/api-keys", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to generate key");
      setNewKey(data.key);
      setKeys((prev) => [
        { id: data.id, last4: data.key.slice(-4), createdAt: new Date().toISOString(), revokedAt: null, usageThisMonth: 0 },
        ...prev,
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setKeys((prev) =>
        prev.map((k) => k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)
      );
    } catch {
      setError("Failed to revoke key");
    }
  }

  function copyKey(val: string) {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeCount = keys.filter((k) => !k.revokedAt).length;
  const totalUsage = keys.reduce((acc, k) => acc + k.usageThisMonth, 0);

  return (
    <div className="ak">
      <style>{`
        .ak-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .ak-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px;
        }
        .ak-sub { font-size: 14px; color: var(--ink-soft); margin-bottom: 28px; }

        .ak-topbar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--line-strong); margin-bottom: 24px; }
        .ak-count { font-family: var(--font-mono); font-size: 13px; color: var(--ink-soft); }

        .nk-banner { border: 1px solid var(--brass); background: var(--brass-tint); padding: 16px 20px; margin-bottom: 24px; border-radius: var(--radius-sm); }
        .nk-label { font-size: 11px; font-weight: 700; color: var(--brass-deep); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .nk-row { display: flex; gap: 8px; align-items: center; }
        .nk-token { flex: 1; font-family: var(--font-mono); font-size: 12px; background: var(--surface); border: 1px solid var(--line); padding: 8px 12px; color: var(--ink); overflow-x: auto; white-space: nowrap; border-radius: var(--radius-sm); }
        .nk-warn { font-size: 11px; color: var(--brass-deep); margin-top: 8px; opacity: 0.8; }

        .ak-error { background: var(--bad-tint); border: 1px solid var(--bad); padding: 12px 16px; font-size: 13px; color: var(--bad); margin-bottom: 20px; border-radius: var(--radius-sm); }

        /* ledger table */
        .ak-table { border-top: 1px solid var(--line); }
        .ak-thead {
          display: grid; grid-template-columns: 110px 1fr 180px 130px 110px;
          padding: 9px 0; border-bottom: 1px solid var(--line-strong);
          font-size: 11px; font-weight: 700; color: var(--ink-faint); letter-spacing: 0.04em;
        }
        .ak-row {
          display: grid; grid-template-columns: 110px 1fr 180px 130px 110px;
          padding: 14px 0; border-bottom: 1px solid var(--line);
          font-size: 13px; align-items: center; transition: background 0.1s;
        }
        .ak-row:last-child { border-bottom: none; }
        .ak-row.revoked { opacity: 0.4; }
        .ak-mono { font-family: var(--font-mono); font-size: 12px; color: var(--ink-soft); }
        .ak-id { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--ink); }
        .ak-date { font-size: 12px; color: var(--ink-faint); }

        /* usage bar inline */
        .ak-usage-cell {}
        .ak-usage-numbers { font-family: var(--font-mono); font-size: 11px; color: var(--ink-faint); margin-bottom: 5px; }
        .ak-usage-numbers strong { color: var(--ink-soft); }
        .ak-bar-track { height: 4px; background: var(--line); border-radius: 2px; overflow: hidden; }
        .ak-bar-fill { height: 100%; background: var(--brass); border-radius: 2px; transition: width 0.5s ease; }

        .ak-revoke-btn { background: none; border: 1px solid var(--line); color: var(--ink-faint); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s; }
        .ak-revoke-btn:hover { border-color: var(--bad); color: var(--bad); }

        .ak-empty { padding: 60px 4px; text-align: center; color: var(--ink-faint); font-size: 14px; }
      `}</style>

      <div className="ak-kicker">Access</div>
      <h1 className="ak-title">API keys</h1>
      <p className="ak-sub">Manage your Meterly API keys. A key is shown only once when generated.</p>

      <div className="ak-topbar">
        <span className="ak-count">
          {activeCount} active key{activeCount !== 1 ? "s" : ""}
          <span style={{ marginLeft: 12, color: "var(--ink-faint)" }}>·</span>
          <span style={{ marginLeft: 12, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-faint)" }}>
            {totalUsage} / {planLimit.toLocaleString()} requests this month
          </span>
        </span>
        <button className="btn btn-brass btn-glow" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Generate new key"}
        </button>
      </div>

      {error && <div className="ak-error">{error}</div>}

      {newKey && (
        <motion.div
          className="nk-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="nk-label">Copy your key — it won't be shown again</div>
          <div className="nk-row">
            <div className="nk-token">{newKey}</div>
            <button className="btn btn-line" style={{ height: 34, fontSize: 12 }} onClick={() => copyKey(newKey)}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div className="nk-warn">⚠ Store this somewhere safe immediately.</div>
        </motion.div>
      )}

      <div className="ak-table">
        <div className="ak-thead">
          <span>Last 4</span>
          <span>Key</span>
          <span>Usage this month</span>
          <span>Created</span>
          <span>Status</span>
        </div>

        {keys.length === 0 ? (
          <div className="ak-empty">No API keys yet. Generate one above.</div>
        ) : (
          <AnimatePresence initial={false}>
            {keys.map((k) => {
              const pct = Math.min((k.usageThisMonth / planLimit) * 100, 100);
              return (
                <motion.div
                  key={k.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`ak-row${k.revokedAt ? " revoked" : ""}`}
                >
                  <span className="ak-id">••••{k.last4}</span>
                  <span className="ak-mono">meterly_••••••••••••{k.last4}</span>

                  <div className="ak-usage-cell">
                    <div className="ak-usage-numbers">
                      <strong>{k.usageThisMonth}</strong> / {planLimit.toLocaleString()}
                    </div>
                    <div className="ak-bar-track">
                      <div className="ak-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <span className="ak-date">
                    {new Date(k.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>

                  <span>
                    {k.revokedAt ? (
                      <span className="pill pill-quiet">Revoked</span>
                    ) : (
                      <button className="ak-revoke-btn" onClick={() => revoke(k.id)}>
                        Revoke
                      </button>
                    )}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}