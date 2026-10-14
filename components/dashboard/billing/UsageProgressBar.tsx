export default function UsageProgressBar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const level = pct >= 90 ? "hot" : pct >= 70 ? "warm" : "cool";

  return (
    <div className="ubar-wrap">
      <div className="ubar-top">
        <span className="ubar-label">This billing cycle</span>
        <span className="ubar-count">
          {used.toLocaleString()} <span className="ubar-count-faint">/ {limit.toLocaleString()} requests</span>
        </span>
      </div>
      <div className="ubar-track">
        <div className={`ubar-fill ubar-${level}`} style={{ width: `${pct}%` }} />
      </div>

      <style>{`
        .ubar-wrap { display: flex; flex-direction: column; gap: 8px; padding: 20px 0; }
        .ubar-top { display: flex; justify-content: space-between; align-items: baseline; }
        .ubar-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); }
        .ubar-count { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--ink); }
        .ubar-count-faint { color: var(--ink-faint); font-weight: 400; }

        .ubar-track {
          height: 6px; border-radius: 3px; background: var(--surface-dim);
          border: 1px solid var(--line); overflow: hidden;
        }
        .ubar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
        .ubar-cool { background: var(--brass); }
        .ubar-warm { background: #fbbf24; }
        .ubar-hot { background: var(--bad); }
      `}</style>
    </div>
  );
}