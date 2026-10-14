type Payment = {
  id: string;
  date: string; // formatted, "Sep 24, 2026"
  plan: string;
  amount: string; // formatted, "₹999"
  status: string;
  paymentId: string;
};

export default function PaymentTimeline({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="pt-empty">
        No payments yet — upgrades will show up here.
        <style>{`
          .pt-empty {
            padding: 40px 24px; text-align: center;
            color: var(--ink-faint); font-size: 13px;
            border: 1px dashed var(--line-strong);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pt-wrap">
      {payments.map((p, i) => {
        const failed = p.status !== "SUCCESS";
        const isLast = i === payments.length - 1;
        return (
          <div key={p.id} className="pt-row">
            <div className="pt-line-col">
              <span className={`pt-dot ${failed ? "pt-dot-bad" : "pt-dot-ok"}`} />
              {!isLast && <span className="pt-line" />}
            </div>
            <div className="pt-body">
              <div className="pt-top">
                <span className="pt-plan">{p.plan}</span>
                <span className={`pt-badge ${failed ? "badge-bad" : "badge-ok"}`}>
                  {failed && <span className="badge-dot" />}
                  {p.status}
                </span>
              </div>
              <div className="pt-mid">
                <span className="pt-amount">{p.amount}</span>
                <span className="pt-date">{p.date}</span>
              </div>
              <span className="pt-id">{p.paymentId}</span>
            </div>
          </div>
        );
      })}

      <style>{`
        .pt-wrap { display: flex; flex-direction: column; }
        .pt-row { display: grid; grid-template-columns: 20px 1fr; gap: 16px; }
        .pt-line-col { display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
        .pt-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .pt-dot-ok { background: var(--brass); }
        .pt-dot-bad { background: var(--bad); }
        .pt-line { width: 1px; flex: 1; background: var(--line-strong); margin-top: 4px; min-height: 40px; }

        .pt-body { padding-bottom: 28px; }
        .pt-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .pt-plan { font-size: 14px; font-weight: 700; color: var(--ink); }
        .pt-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          padding: 2px 8px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 5px;
        }
        .badge-ok { background: var(--brass-tint); color: var(--brass-deep); }
        .badge-bad { background: var(--bad-tint); color: var(--bad); }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--bad); }

        .pt-mid { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
        .pt-amount { font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: var(--ink); }
        .pt-date { font-size: 12px; color: var(--ink-faint); }
        .pt-id { font-family: var(--font-mono); font-size: 11px; color: var(--ink-faint); }
      `}</style>
    </div>
  );
}