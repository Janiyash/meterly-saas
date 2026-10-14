import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HomeHero from "@/components/home/HomeHero";
import Reveal from "@/components/motion/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import Counter from "@/components/motion/Counter";

const CAPABILITIES = [
  { index: "01", title: "Usage tracking", copy: "Every request logged per key, per day. Nothing that happens on your API goes unmeasured.", status: "Live" },
  { index: "02", title: "Usage-based billing", copy: "Charge customers for what they actually consume instead of guessing at a flat monthly rate.", status: "Live" },
  { index: "03", title: "Analytics dashboard", copy: "Running readout of usage trends, remaining quota, and account status — all in one place.", status: "Live" },
  { index: "04", title: "Limit enforcement", copy: "Requests are checked against plan limits in real time and blocked the moment they're exceeded.", status: "Live" },
  { index: "05", title: "Image generation metering", copy: "Track, bill, and throttle image generation calls — Stable Diffusion, DALL·E, or your own model — at the per-image level.", status: "Soon" },
  { index: "06", title: "Object removal & inpainting", copy: "Meter AI-powered object removal and inpainting operations separately from standard generation, with per-pixel pricing support.", status: "Soon" },
  { index: "07", title: "Video processing pipeline", copy: "Usage metering for frame extraction, transcription, and video analysis APIs — billed per second of footage processed.", status: "Soon" },
];

const PROCESS = [
  { step: "01", title: "Sign in with Google", copy: "Authentication runs through NextAuth — no separate account or password needed." },
  { step: "02", title: "Free plan assigned", copy: "Every new account starts on the free tier with 200 requests per month automatically." },
  { step: "03", title: "Usage is measured", copy: "Each request against your API is recorded in real time as it happens." },
  { step: "04", title: "Limits are enforced", copy: "Once a plan's quota is reached, further requests return 429 immediately." },
  { step: "05", title: "Upgrade when ready", copy: "Move to a higher plan the moment your usage outgrows the current tier." },
];

const STATS = [
  { label: "Requests tracked / month", value: 200000, suffix: "+", text: null },
  { label: "Enforcement", value: null, suffix: null, text: "Real time" },
  { label: "Auth", value: null, suffix: null, text: "Google OAuth" },
  { label: "Plans", value: null, suffix: null, text: "Free · Pro · Enterprise" },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const analysisHref = session ? "/dashboard/text-analysis" : "/auth/signin";
  const primaryHref = session ? "/dashboard" : "/auth/signin";
  const primaryLabel = session ? "Open dashboard" : "Get started free";

  return (
    <div className="site">
      <main>
        {/* HERO — no canvas, HomeHero has the ticker built in */}
        <section className="hero">
          <div className="hero-veil" aria-hidden="true" />
          <HomeHero
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
            analysisHref={analysisHref}
          />
        </section>

        <Reveal>
          <section className="stats-strip">
            <div className="stats-inner">
              {STATS.map((s, i) => (
                <div key={s.label} className="stat-cell">
                  {i > 0 && <span className="stat-divider" />}
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value reading">
                    {s.value !== null ? <Counter value={s.value} suffix={s.suffix ?? ""} /> : s.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <section className="block">
          <Reveal>
            <div className="section-head">
              <span className="section-kicker">Capabilities</span>
              <h2 className="section-title">What Meterly measures — and what's coming.</h2>
              <p className="section-sub">Live features ship today. Roadmap items are in active development.</p>
            </div>
          </Reveal>
          <StaggerGroup className="cap-grid">
            {CAPABILITIES.map((cap) => (
              <StaggerItem key={cap.title} className="cap-card">
                <div className="cap-card-top">
                  <span className="cap-index reading">{cap.index}</span>
                  <span className={`cap-badge ${cap.status === "Live" ? "badge-live" : "badge-soon"}`}>
                    {cap.status === "Live" ? <><span className="badge-dot" />Live</> : "Soon"}
                  </span>
                </div>
                <h3 className="cap-title">{cap.title}</h3>
                <p className="cap-copy">{cap.copy}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section className="block">
          <Reveal>
            <div className="section-head">
              <span className="section-kicker">How it works</span>
              <h2 className="section-title">From sign-in to billing in five steps.</h2>
            </div>
          </Reveal>
          <StaggerGroup className="process-wrap">
            {PROCESS.map((step, i) => (
              <StaggerItem key={step.step} className="process-row">
                <div className="process-left">
                  <span className="process-num reading">{step.step}</span>
                  {i < PROCESS.length - 1 && <span className="process-line" />}
                </div>
                <div className="process-body">
                  <span className="process-title">{step.title}</span>
                  <span className="process-copy">{step.copy}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <Reveal>
          <section className="closing">
            <div className="closing-inner glow-ring">
              <div className="closing-left">
                <p className="closing-kicker">Ready to meter</p>
                <h2 className="closing-title">Start measuring in minutes.</h2>
                <p className="closing-sub">Free plan, no credit card. Upgrade when your usage grows past 200 requests a month.</p>
              </div>
              <div className="closing-actions">
                <Link href={primaryHref} className="btn btn-brass btn-glow">{primaryLabel}</Link>
                <Link href={analysisHref} className="btn btn-line">Try the analyzer</Link>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <footer className="site-footer">
        <span className="footer-mark">Meterly</span>
        <span className="footer-note">© {new Date().getFullYear()} — Usage-based SaaS billing infrastructure</span>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
        </div>
      </footer>

      <style>{`
        .site { background: var(--paper); min-height: 100vh; overflow-x: clip; }
        main, .site-footer { max-width: 1180px; margin: 0 auto; padding-left: 28px; padding-right: 28px; }

        .hero {
          position: relative; overflow: hidden;
          border-bottom: 1px solid var(--line-strong);
          background: var(--paper);
        }
        .hero-veil {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 80% at 20% 50%, rgba(52,211,153,0.05), transparent 70%);
        }

        .stats-strip { border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--surface); margin: 0 -28px; }
        .stats-inner { display: flex; align-items: center; flex-wrap: wrap; padding: 0 28px; max-width: 1180px; margin: 0 auto; }
        .stat-cell { display: flex; flex-direction: column; gap: 4px; padding: 22px 32px 22px 0; flex: 1; min-width: 160px; position: relative; }
        .stat-divider { position: absolute; left: -1px; top: 20%; height: 60%; width: 1px; background: var(--line-strong); }
        .stat-cell:first-child { padding-left: 0; }
        .stat-label { font-size: 11px; color: var(--ink-faint); }
        .stat-value { font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: var(--ink); }

        .block { padding: 72px 0 16px; }
        .section-head { margin-bottom: 40px; max-width: 600px; }
        .section-kicker { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brass-deep); margin-bottom: 12px; }
        .section-title { font-family: var(--font-display); font-weight: 500; font-style: italic; font-size: clamp(22px, 2.8vw, 30px); color: var(--ink); line-height: 1.15; margin-bottom: 10px; }
        .section-sub { font-size: 14px; color: var(--ink-soft); line-height: 1.6; }

        .cap-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
        @media (max-width: 900px) { .cap-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .cap-grid { grid-template-columns: 1fr; } }
        .cap-card { padding: 28px 24px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; transition: background 0.2s; position: relative; overflow: hidden; }
        .cap-card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 0% 0%, rgba(52,211,153,0.04), transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .cap-card:hover { background: var(--surface); }
        .cap-card:hover::before { opacity: 1; }
        .cap-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .cap-index { font-size: 11px; color: var(--ink-faint); font-weight: 600; }
        .cap-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 5px; }
        .badge-live { background: var(--brass-tint); color: var(--brass-deep); }
        .badge-soon { background: var(--surface-dim); color: var(--ink-faint); border: 1px solid var(--line-strong); }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--brass); }
        .cap-title { font-size: 15px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .cap-copy { font-size: 13px; color: var(--ink-soft); line-height: 1.6; }

        .process-wrap { max-width: 560px; padding-top: 8px; }
        .process-row { display: grid; grid-template-columns: 52px 1fr; position: relative; }
        .process-left { display: flex; flex-direction: column; align-items: center; padding-top: 2px; }
        .process-num { font-size: 12px; font-weight: 700; color: var(--brass-deep); width: 28px; height: 28px; border-radius: 50%; background: var(--brass-tint); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--font-mono); }
        .process-line { width: 1px; flex: 1; background: var(--line-strong); margin: 6px 0; min-height: 32px; }
        .process-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 0 28px; }
        .process-title { font-size: 14px; font-weight: 700; color: var(--ink); }
        .process-copy { font-size: 13px; color: var(--ink-soft); line-height: 1.55; }

        .closing { padding: 64px 0 56px; }
        .closing-inner { display: flex; justify-content: space-between; align-items: center; gap: 32px; flex-wrap: wrap; padding: 44px 40px; border: 1px solid var(--line-strong); background: var(--surface); position: relative; overflow: hidden; }
        .closing-inner::before { content: ""; position: absolute; top: -60px; right: -60px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(52,211,153,0.08), transparent 70%); pointer-events: none; }
        .closing-left { max-width: 480px; }
        .closing-kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brass-deep); display: block; margin-bottom: 10px; }
        .closing-title { font-family: var(--font-display); font-weight: 500; font-size: clamp(22px, 2.8vw, 30px); color: var(--ink); margin-bottom: 10px; line-height: 1.15; }
        .closing-sub { font-size: 14px; color: var(--ink-soft); line-height: 1.6; }
        .closing-actions { display: flex; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }

        .site-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: 26px; padding-bottom: 80px; font-size: 12px; color: var(--ink-faint); border-top: 1px solid var(--line); }
        .footer-mark { font-family: var(--font-display); font-style: italic; color: var(--ink); font-size: 14px; }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a { color: var(--ink-faint); text-decoration: none; transition: color 0.15s; }
        .footer-links a:hover { color: var(--brass-deep); }

        @media (max-width: 680px) {
          .stats-strip { margin-left: 0; margin-right: 0; }
          .stat-cell { padding: 16px 16px 16px 0; min-width: 130px; }
          .closing-inner { padding: 28px 24px; }
          .closing-actions { width: 100%; }
        }
      `}</style>
    </div>
  );
}