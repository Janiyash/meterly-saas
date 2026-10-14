"use client";
import { useState } from "react";

type DayData = { count: number; keys: string[] };

export default function UsageHeatmap({
  dayMap,
}: {
  dayMap: Record<string, DayData>;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const maxCount = Math.max(...Object.values(dayMap).map((d) => d.count), 1);

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { d, iso, data: dayMap[iso] ?? null };
  });

  const selectedData = selected ? dayMap[selected] : null;

  const cellBg = (intensity: number) => {
    const op = 0.12 + intensity * 0.88;
    return `rgba(52, 211, 153, ${op.toFixed(2)})`;
  };

  return (
    <div>
      <style>{`
        .hm-label { font-size: 11px; font-weight: 700; color: var(--ink-faint); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }

        .hm-cal { max-width: 340px; }

        .hm-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 3px; }
        .hm-dow { font-size: 10px; color: var(--ink-faint); text-align: center; }

        .hm-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .hm-cell {
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid transparent;
          transition: border-color 0.15s;
        }
        .hm-cell:hover { border-color: var(--brass); }
        .hm-cell.selected { border-color: var(--brass-deep) !important; box-shadow: 0 0 0 1px var(--brass-deep); }
        .hm-cell.empty { background: transparent !important; cursor: default; pointer-events: none; border: none; }
        .hm-cell.no-data { background: var(--line) !important; cursor: default; }
        .hm-cell.no-data:hover { border-color: transparent; }

        .hm-detail { margin-top: 16px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--radius-sm); max-width: 340px; }
        .hm-detail-date { font-size: 11px; font-weight: 700; color: var(--ink-faint); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .hm-detail-count { font-family: var(--font-mono); font-size: 24px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
        .hm-detail-count span { font-size: 13px; color: var(--ink-faint); font-weight: 400; margin-left: 6px; }
        .hm-detail-keys { display: flex; flex-wrap: wrap; gap: 5px; }
        .hm-detail-key { font-family: var(--font-mono); font-size: 11px; color: var(--brass-deep); background: var(--brass-tint); padding: 2px 7px; border-radius: var(--radius-sm); }

        .hm-legend { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
        .hm-legend-label { font-size: 10px; color: var(--ink-faint); }
        .hm-legend-cells { display: flex; gap: 2px; }
        .hm-legend-cell { width: 10px; height: 10px; border-radius: 2px; }
      `}</style>

      <div className="hm-label">
        {now.toLocaleString("default", { month: "long" })} {year}
      </div>

      <div className="hm-cal">
        <div className="hm-dow-row">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="hm-dow">{d}</div>
          ))}
        </div>

        <div className="hm-grid">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} className="hm-cell empty" />
          ))}

          {days.map(({ d, iso, data }) => {
            const intensity = data ? data.count / maxCount : 0;
            return (
              <div
                key={iso}
                className={`hm-cell${selected === iso ? " selected" : ""}${!data ? " no-data" : ""}`}
                style={{ background: data ? cellBg(intensity) : undefined }}
                title={data ? `${d}: ${data.count} requests` : `${d}: no activity`}
                onClick={() => {
                  if (!data) return;
                  setSelected(selected === iso ? null : iso);
                }}
              />
            );
          })}
        </div>

        <div className="hm-legend">
          <span className="hm-legend-label">Less</span>
          <div className="hm-legend-cells">
            {[0.12, 0.3, 0.5, 0.72, 1].map((op) => (
              <div
                key={op}
                className="hm-legend-cell"
                style={{ background: `rgba(52, 211, 153, ${op})` }}
              />
            ))}
          </div>
          <span className="hm-legend-label">More</span>
        </div>
      </div>

      {selected && selectedData && (
        <div className="hm-detail">
          <div className="hm-detail-date">
            {new Date(selected + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
          </div>
          <div className="hm-detail-count">
            {selectedData.count}
            <span>requests</span>
          </div>
          <div className="hm-detail-keys">
            {[...new Set(selectedData.keys)].map((k) => (
              <span key={k} className="hm-detail-key">••••{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}