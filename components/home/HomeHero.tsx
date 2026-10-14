"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const METHODS  = ["POST", "GET",  "POST", "POST", "GET",  "POST"];
const ENDPOINTS = ["/api/analyze", "/api/usage", "/api/analyze", "/api/keys", "/api/analyze", "/api/billing"];
const KEYS     = ["••••5524", "••••a2f1", "••••8d3c", "••••5524", "••••f90e", "••••a2f1"];
const STATUSES = ["✓", "✓", "✓", "✓", "✓", "429"];
const TIMES    = ["2ms", "1ms", "3ms", "2ms", "1ms", "0ms"];
const PLANS    = ["PRO", "FREE", "PRO", "PRO", "FREE", "FREE"];

// Only called in the browser (inside useEffect), never during server render
function generateRow(i: number) {
  const idx = i % METHODS.length;
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  return {
    id: i, // stable, unique key (counter increases on every new row)
    time: t,
    method: METHODS[idx],
    endpoint: ENDPOINTS[idx],
    key: KEYS[idx],
    status: STATUSES[idx],
    ms: TIMES[idx],
    plan: PLANS[idx],
  };
}

type Row = ReturnType<typeof generateRow>;

function RequestTicker() {
  // Start empty so server HTML and first client render match (no hydration error)
  const [rows, setRows] = useState<Row[]>([]);
  const [blink, setBlink] = useState(true);
  const counter = useRef(7);

  useEffect(() => {
    // Build the initial rows only in the browser, after hydration
    setRows(Array.from({ length: 7 }, (_, i) => generateRow(i)));
    counter.current = 7;

    const b = setInterval(() => setBlink(v => !v), 530);
    const r = setInterval(() => {
      setRows(prev => [...prev.slice(-9), generateRow(counter.current++)]);
    }, 6000);
    return () => { clearInterval(b); clearInterval(r); };
  }, []);

  return (
    <div className="ticker-wrap">
      <div className="ticker-header">
        <div className="ticker-dots">
          <span className="tdot tdot-r" /><span className="tdot tdot-y" /><span className="tdot tdot-g" />
        </div>
        <span className="ticker-title">meterly · live feed (Demo)</span>
        <span className="ticker-live"><span className="ticker-live-dot" />LIVE</span>
      </div>

      <div className="ticker-cols">
        <span>TIME</span><span>MTD</span><span>ENDPOINT</span><span>KEY</span><span>PLAN</span><span>MS</span><span>ST</span>
      </div>

      <div className="ticker-rows">
        {rows.map((row, i) => {
          const is429 = row.status === "429";
          const isNew = i === rows.length - 1;
          return (
            <motion.div
              key={row.id}
              className={`ticker-row${is429 ? " row-err" : ""}${isNew ? " row-new" : ""}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="tr-time">{row.time}</span>
              <span className={`tr-method ${row.method === "POST" ? "m-post" : "m-get"}`}>{row.method}</span>
              <span className="tr-ep">{row.endpoint}</span>
              <span className="tr-key">{row.key}</span>
              <span className={`tr-plan ${row.plan === "PRO" ? "p-pro" : "p-free"}`}>{row.plan}</span>
              <span className="tr-ms">{row.ms}</span>
              <span className={`tr-st ${is429 ? "s-err" : "s-ok"}`}>{row.status}</span>
            </motion.div>
          );
        })}
        <div className="ticker-row ticker-cursor">
          <span className="tr-time">&nbsp;</span>
          <span style={{ color: blink ? "var(--brass)" : "transparent", fontSize: 14 }}>▋</span>
        </div>
      </div>

      <div className="ticker-footer">
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brass)", display: "inline-block" }} />
          Tracking active
        </span>
        <span>Quota enforced in real time</span>
      </div>
    </div>
  );
}

export default function HomeHero({ primaryHref, primaryLabel, analysisHref }: { primaryHref: string; primaryLabel: string; analysisHref: string }) {
  const reduce = useReducedMotion();

  return (
    <div className="hero-inner">
      <motion.div className="hero-content" initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"} variants={container}>
        <motion.p className="hero-kicker" variants={item}>Usage metering for SaaS APIs</motion.p>
        <motion.h1 className="hero-head" variants={item}>
          <span className="glow-text">Every request,<br />measured.</span>
          <br />Every invoice,<br />explainable.
        </motion.h1>
        <motion.p className="hero-lede" variants={item}>
          Meterly records API usage as it happens, enforces plan limits before they're broken, and turns raw consumption into billing your customers can verify.
        </motion.p>
        <motion.div className="hero-actions" variants={item}>
          <Link href={primaryHref} className="btn btn-brass btn-glow">{primaryLabel}</Link>
          <Link href={analysisHref} className="btn btn-line">Try the text analyzer</Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-right"
        initial={reduce ? undefined : { opacity: 0, x: 48 }}
        animate={reduce ? undefined : { opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      >
        <RequestTicker />
      </motion.div>

      <style>{`
        .hero-inner {
          position: relative; z-index: 2;
          width: 100%; max-width: 1180px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          gap: 48px; padding: 110px 28px 64px;
        }
        .hero-content { max-width: 480px; flex-shrink: 0; }
        .hero-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 18px; }
        .hero-head {
          font-family: var(--font-display); font-weight: 500;
          font-size: clamp(30px, 4.4vw, 50px); line-height: 1.06;
          letter-spacing: -0.5px; color: var(--ink); margin-bottom: 22px;
        }
        .hero-lede { font-size: 15px; line-height: 1.65; color: var(--ink-soft); max-width: 44ch; margin-bottom: 30px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        .hero-right { flex: 1; max-width: 560px; min-width: 0; }

        /* TICKER */
        .ticker-wrap {
          border: 1px solid var(--line-strong); border-radius: 6px;
          background: var(--surface); overflow: hidden; font-family: var(--font-mono);
          box-shadow: 0 0 48px -16px rgba(52,211,153,0.22), 0 0 0 1px rgba(52,211,153,0.06);
        }
        .ticker-header {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; background: var(--surface-dim);
          border-bottom: 1px solid var(--line);
        }
        .ticker-dots { display: flex; gap: 5px; }
        .tdot { width: 10px; height: 10px; border-radius: 50%; }
        .tdot-r { background: #f87171; }
        .tdot-y { background: #fbbf24; }
        .tdot-g { background: var(--brass); }
        .ticker-title { font-size: 11px; color: var(--ink-faint); flex: 1; }
        .ticker-live { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: var(--brass-deep); letter-spacing: 0.08em; }
        .ticker-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brass); animation: pdot 1.4s ease-in-out infinite; }
        @keyframes pdot { 0%,100%{opacity:1} 50%{opacity:0.25} }

        .ticker-cols {
          display: grid; grid-template-columns: 68px 44px 1fr 76px 44px 32px 28px;
          padding: 6px 14px; border-bottom: 1px solid var(--line);
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
          color: var(--ink-faint); text-transform: uppercase;
        }
        .ticker-rows { overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; min-height: 260px; }
        .ticker-row {
          display: grid; grid-template-columns: 68px 44px 1fr 76px 44px 32px 28px;
          padding: 5px 14px; border-bottom: 1px solid rgba(33,34,33,0.5);
          font-size: 11px; align-items: center;
        }
        .ticker-row:last-child { border-bottom: none; }
        .row-err { background: rgba(248,113,113,0.04); }
        .row-new { background: rgba(52,211,153,0.03); }

        .tr-time { font-size: 10px; color: var(--ink-faint); }
        .tr-ep   { font-size: 10px; color: var(--ink-soft); }
        .tr-key  { font-size: 10px; color: var(--ink-faint); }
        .tr-ms   { font-size: 10px; color: var(--ink-faint); }

        .m-post { color: var(--brass-deep); font-size: 10px; font-weight: 700; }
        .m-get  { color: #60a5fa; font-size: 10px; font-weight: 700; }
        .p-pro  { color: var(--brass-deep); font-size: 9px; font-weight: 700; }
        .p-free { color: var(--ink-faint); font-size: 9px; }
        .s-ok   { color: var(--brass); font-weight: 700; }
        .s-err  { color: var(--bad); font-weight: 700; }

        .ticker-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 14px; border-top: 1px solid var(--line);
          background: var(--surface-dim); font-size: 10px; color: var(--ink-faint);
        }

        @media (max-width: 900px) {
          .hero-inner { flex-direction: column; padding: 80px 28px 40px; gap: 32px; }
          .hero-content { max-width: 100%; }
          .hero-right { max-width: 100%; width: 100%; }
        }
      `}</style>
    </div>
  );
}