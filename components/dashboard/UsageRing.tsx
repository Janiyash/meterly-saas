"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import Counter from "@/components/motion/Counter";

export default function UsageRing({
  used,
  limit,
  planName,
}: {
  used: number;
  limit: number; // pass a large finite number for "unlimited"
  planName: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  const pct = Math.min(used / limit, 1);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="usage-ring-wrap">
      <svg ref={ref} viewBox="0 0 200 200" className="usage-ring-svg">
        <circle cx="100" cy="100" r={radius} className="usage-ring-track" />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          className="usage-ring-fill"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: inView || reduce ? offset : circumference }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="usage-ring-center">
        <span className="usage-ring-num reading"><Counter value={used} /></span>
        <span className="usage-ring-label">of {limit >= 999999 ? "∞" : limit.toLocaleString()}</span>
        <span className="usage-ring-plan">{planName}</span>
      </div>

      <style>{`
        .usage-ring-wrap { position: relative; width: 200px; height: 200px; flex-shrink: 0; }
        .usage-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .usage-ring-track { fill: none; stroke: var(--line); stroke-width: 10; }
        .usage-ring-fill { fill: none; stroke: var(--brass); stroke-width: 10; stroke-linecap: round;
          filter: drop-shadow(0 0 8px rgba(52,211,153,0.5)); }
        .usage-ring-center {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center; gap: 2px;
        }
        .usage-ring-num { font-family: var(--font-mono); font-size: 30px; font-weight: 600; color: var(--ink); }
        .usage-ring-label { font-size: 11px; color: var(--ink-faint); }
        .usage-ring-plan { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--brass); margin-top: 6px; }
      `}</style>
    </div>
  );
}
