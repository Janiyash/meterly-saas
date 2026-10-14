"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const COUNTER_ITEMS = [
  { value: 200000, label: "requests metered" },
  { value: 3, label: "plan tiers" },
  { value: 99, label: "uptime %" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}</>;
}

export default function SignInPage() {
  const [hover, setHover] = useState(false);

  return (
    <div className="si-root">
      {/* corner glows only — no lines */}
      <div className="si-corner-tl" aria-hidden="true" />
      <div className="si-corner-br" aria-hidden="true" />

      {/* wordmark */}
      <motion.a
        href="/"
        className="si-mark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >

      </motion.a>

      {/* main layout */}
      <div className="si-layout">

        {/* LEFT */}
        <div className="si-left">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="si-eyebrow"
          >
            <span className="si-eyebrow-dot" />
            Usage metering infrastructure
          </motion.div>

          <div className="si-big-type">
            {["Every", "request,", "measured."].map((word, i) => (
              <motion.div
                key={i}
                className={`si-type-line${i === 1 ? " si-type-accent" : ""}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.div>
            ))}
          </div>

          {/* counters */}
          <motion.div
            className="si-counters"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {COUNTER_ITEMS.map((item, i) => (
              <div key={item.label} className="si-counter-cell">
                {i > 0 && <span className="si-counter-sep" />}
                <span className="si-counter-val reading">
                  <AnimatedCounter target={item.value} />
                  {item.value === 200000 ? "+" : item.value === 99 ? "%" : ""}
                </span>
                <span className="si-counter-label">{item.label}</span>
              </div>
            ))}
          </motion.div>

          {/* social proof */}
          <motion.div
            className="si-social"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <span className="si-social-label">Trusted by developers building on</span>
            <div className="si-social-tags">
              {["Next.js", "FastAPI", "Express", "Laravel", "Rails"].map((t) => (
                <span key={t} className="si-social-tag">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <motion.div
          className="si-right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="si-panel">
            <div className="si-panel-bar" />

            <div className="si-panel-inner">
              <p className="si-panel-kicker">Get started</p>
              <h2 className="si-panel-title">Sign in to Meterly</h2>
              <p className="si-panel-sub">
                One click. Free plan assigned instantly.<br />No credit card needed.
              </p>

              <motion.button
                className="si-btn"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                onHoverStart={() => setHover(true)}
                onHoverEnd={() => setHover(false)}
                whileTap={{ scale: 0.97 }}
              >
                <motion.span
                  className="si-btn-bg"
                  animate={{ opacity: hover ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ position: "relative", zIndex: 1 }}>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.5 26.9 36.5 24 36.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.7 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.8 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
                <span style={{ position: "relative", zIndex: 1 }}>Continue with Google</span>
              </motion.button>

              <div className="si-pills">
                {["Free · 200 req/mo", "Upgrade anytime", "Real-time limits"].map((p) => (
                  <span key={p} className="si-pill">
                    <span className="si-pill-dot" />{p}
                  </span>
                ))}
              </div>

              <p className="si-legal">
                By continuing you agree to Meterly's terms and usage policy.
              </p>
            </div>

          </div>
        </motion.div>
      </div>

      {/* footer */}
      <motion.div
        className="si-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <span>© {new Date().getFullYear()} Meterly</span>
        <span className="si-footer-sep" />
        <a href="/pricing">Pricing</a>
        <span className="si-footer-sep" />
        <a href="/docs">Docs</a>
      </motion.div>

      <style>{`
        * { box-sizing: border-box; }

        .si-root {
          min-height: 100vh; background: var(--paper);
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }

        .si-corner-tl {
          position: absolute; top: -160px; left: -160px;
          width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.08), transparent 65%);
          pointer-events: none;
        }
        .si-corner-br {
          position: absolute; bottom: -120px; right: -120px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.06), transparent 65%);
          pointer-events: none;
        }

        .si-mark {
          position: absolute; top: 28px; left: 36px; z-index: 10;
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-display); font-style: italic;
          font-size: 16px; font-weight: 500; color: var(--ink);
          text-decoration: none;
        }
        .si-mark svg { color: var(--brass); }

        .si-layout {
          flex: 1; display: grid;
          grid-template-columns: 1fr 420px;
          gap: 0; align-items: center;
          max-width: 1140px; width: 100%;
          margin: 0 auto;
          padding: 100px 40px 60px;
          min-height: calc(100vh - 60px);
        }
        @media (max-width: 860px) {
          .si-layout { grid-template-columns: 1fr; gap: 48px; padding: 100px 24px 40px; }
        }

        .si-left { padding-right: 60px; }
        @media (max-width: 860px) { .si-left { padding-right: 0; } }

        .si-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 28px;
        }
        .si-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--brass);
          animation: si-pulse 2s ease-in-out infinite;
        }
        @keyframes si-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }

        .si-big-type { margin-bottom: 48px; }
        .si-type-line {
          font-family: var(--font-display); font-weight: 500;
          font-size: clamp(44px, 7vw, 82px); line-height: 0.95;
          color: var(--ink); letter-spacing: -1px; display: block;
        }
        .si-type-accent {
          background: linear-gradient(90deg, var(--brass) 0%, var(--brass-deep) 60%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent; font-style: italic;
        }

        .si-counters {
          display: inline-flex; align-items: center;
          border: 1px solid var(--line); margin-bottom: 0;
        }
        .si-counter-cell {
          padding: 14px 24px; display: flex; flex-direction: column;
          gap: 3px; position: relative;
        }
        .si-counter-sep {
          position: absolute; left: 0; top: 20%; height: 60%;
          width: 1px; background: var(--line);
        }
        .si-counter-val {
          font-family: var(--font-mono); font-size: 18px;
          font-weight: 700; color: var(--ink); line-height: 1;
        }
        .si-counter-label {
          font-size: 10px; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.06em;
        }

        .si-social { margin-top: 28px; }
        .si-social-label {
          font-size: 11px; color: var(--ink-faint);
          display: block; margin-bottom: 10px; letter-spacing: 0.04em;
        }
        .si-social-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .si-social-tag {
          font-size: 11px; font-weight: 600; color: var(--ink-faint);
          border: 1px solid var(--line); padding: 3px 10px;
          border-radius: var(--radius-sm);
          transition: border-color 0.15s, color 0.15s;
        }
        .si-social-tag:hover { border-color: var(--brass); color: var(--brass-deep); }

        .si-right {}
        .si-panel {
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 4px; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(52,211,153,0.06), 0 40px 100px -24px rgba(0,0,0,0.7);
        }

        .si-panel-bar {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--brass), transparent);
          background-size: 200% auto;
          animation: si-barsheen 2s linear infinite;
        }
        @keyframes si-barsheen { 0%{background-position:0% center} 100%{background-position:200% center} }

        .si-panel-inner { padding: 36px 32px 28px; }

        .si-panel-kicker {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--brass-deep); margin-bottom: 8px;
        }
        .si-panel-title {
          font-family: var(--font-display); font-weight: 500;
          font-size: 26px; color: var(--ink); margin-bottom: 8px; line-height: 1.1;
        }
        .si-panel-sub {
          font-size: 13px; color: var(--ink-soft);
          line-height: 1.6; margin-bottom: 28px;
        }

        .si-btn {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; height: 48px;
          border: 1px solid var(--line-strong);
          border-radius: var(--radius-sm);
          background: var(--ink); color: var(--paper);
          font-size: 14px; font-weight: 600;
          cursor: pointer; margin-bottom: 20px;
          transition: border-color 0.2s;
        }
        .si-btn:hover { border-color: var(--brass); }
        .si-btn-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(52,211,153,0.08), transparent);
          pointer-events: none;
        }

        .si-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
        .si-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--ink-faint);
          background: var(--surface-dim); border: 1px solid var(--line);
          padding: 4px 10px; border-radius: var(--radius-pill);
        }
        .si-pill-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--brass); }

        .si-legal { font-size: 11px; color: var(--ink-faint); line-height: 1.5; }


        .si-footer {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 40px; border-top: 1px solid var(--line);
          font-size: 11px; color: var(--ink-faint);
        }
        .si-footer a { color: var(--ink-faint); text-decoration: none; transition: color 0.15s; }
        .si-footer a:hover { color: var(--brass-deep); }
        .si-footer-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--line-strong); }

        @media (max-width: 480px) {
          .si-type-line { font-size: 52px; }
          .si-panel-inner { padding: 28px 20px 20px; }
          .si-meter-wrap { padding: 14px 20px 16px; }
          .si-footer { padding: 16px 24px; }
        }
      `}</style>
    </div>
  );
}