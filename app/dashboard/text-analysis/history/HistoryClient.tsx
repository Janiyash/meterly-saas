"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface HistoryRow {
  id: string;
  preview: string;
  wordCount: number;
  fleschScore: number;
  readability: string;
  createdAt: string;
}

export default function HistoryClient({ initialRows }: { initialRows: HistoryRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="hist-table">
      <style>{`
        .hist-table { border-top: 1px solid var(--line); }
        .hist-row {
          display: grid; grid-template-columns: 110px 1fr 90px 130px 70px;
          gap: 16px; align-items: center;
          padding: 14px 4px; border-bottom: 1px solid var(--line);
          font-size: 13px;
        }
        .hist-row:last-child { border-bottom: none; }
        .hist-header {
          font-size: 11px; font-weight: 700; color: var(--ink-faint);
          padding: 10px 4px; border-bottom: 1px solid var(--line-strong);
        }
        .hist-date { color: var(--ink-faint); font-size: 12px; }
        .hist-preview { color: var(--ink); text-decoration: none; }
        .hist-preview:hover { color: var(--brass); }
        .hist-words { font-family: var(--font-mono); color: var(--ink-soft); }
        .hist-empty { padding: 40px 4px; text-align: center; color: var(--ink-faint); font-size: 14px; }
        @media (max-width: 720px) {
          .hist-row, .hist-header { grid-template-columns: 90px 1fr 60px; }
          .hist-words, .hist-header span:nth-child(4) { display: none; }
        }
      `}</style>

      <div className="hist-row hist-header">
        <span>Date</span>
        <span>Preview</span>
        <span>Words</span>
        <span>Readability</span>
        <span></span>
      </div>

      {rows.length === 0 ? (
        <div className="hist-empty">No saved analyses yet — run one on the workspace page.</div>
      ) : (
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div
              key={r.id}
              className="hist-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="hist-date">
                {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <Link href={`/dashboard/text-analysis/history/${r.id}`} className="hist-preview">
                {r.preview || "(empty)"}…
              </Link>
              <span className="hist-words">{r.wordCount}</span>
              <span className="pill pill-quiet" style={{ justifySelf: "start" }}>{r.readability}</span>
              <button
                className="btn btn-quiet"
                style={{ height: 28, padding: "0 10px", fontSize: 11 }}
                onClick={() => remove(r.id)}
                disabled={busyId === r.id}
              >
                {busyId === r.id ? "…" : "Delete"}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
