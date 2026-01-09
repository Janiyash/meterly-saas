import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Navbar from "@/components/Navbar";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="wrapper">
      {/* ================= HEADER ================= */}
        <Navbar />

      {/* ================= HERO ================= */}
      <main className="home">
        <section className="hero">
          <h1>
            Usage-Based <span>SaaS Billing</span> Platform
          </h1>

          <p className="hero-text">
            Meterly helps SaaS teams track API usage, manage subscriptions,
            enforce limits, and scale billing with confidence.
          </p>

          {/* ✅ HERO BUTTONS */}
          <div className="hero-buttons">
            {/* TEXT ANALYSIS */}
            {!session ? (
              <Link href="/auth/signin" className="btn secondary">
                Text Analysis
              </Link>
            ) : (
              <Link href="/dashboard/text-analysis" className="btn secondary">
                Text Analysis
              </Link>
            )}

            {/* PRIMARY CTA */}
            {!session ? (
              <Link href="/auth/signin" className="btn primary">
                Get Started
              </Link>
            ) : (
              <Link href="/dashboard" className="btn primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="section scroll-target" id="features">
          <h2 className="section-title">Meterly Features</h2>

          <div className="card-grid">
            <Card icon="📊" title="Usage Tracking">
              Track API usage daily, weekly, and monthly with accurate metrics.
            </Card>

            <Card icon="💳" title="Usage-Based Billing">
              Bill customers fairly based on real usage instead of fixed plans.
            </Card>

            <Card icon="📈" title="Analytics Dashboard">
              Visualize usage trends, limits, and growth with clean charts.
            </Card>

            <Card icon="⛔" title="Limit Enforcement">
              Automatically block requests when plan limits are reached.
            </Card>

            <Card icon="🔐" title="Secure Authentication">
              Google OAuth authentication powered by NextAuth.
            </Card>

            <Card icon="🚀" title="Production Ready">
              Scales smoothly from MVP to real-world SaaS.
            </Card>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="section scroll-target" id="how">
          <h2 className="section-title">How Meterly Works</h2>

          <div className="card-grid">
            <Card icon="🔐" title="Sign In with Google">
              Users authenticate securely using Google OAuth.
            </Card>

            <Card icon="🎁" title="Free Plan Assigned">
              Every user starts with a free plan automatically.
            </Card>

            <Card icon="📊" title="Usage is Tracked">
              Each API request is tracked in real time.
            </Card>

            <Card icon="⛔" title="Limits Enforced">
              Requests are blocked when usage limits are exceeded.
            </Card>

            <Card icon="🚀" title="Upgrade Anytime">
              Upgrade seamlessly as usage grows.
            </Card>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} <strong>Meterly</strong> · Usage-Based SaaS
          Billing Platform
        </p>
        <p className="tech">
          Built with Next.js · Prisma · PostgreSQL · NextAuth
        </p>
      </footer>

      {/* ================= STYLES ================= */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .wrapper {
          background: radial-gradient(circle at top, #111, #000);
          min-height: 100vh;
          color: white;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 32px;
          background: rgba(0,0,0,0.85);
          border-bottom: 1px solid #222;
          backdrop-filter: blur(8px);
        }

        .logo {
          font-size: 20px;
          font-weight: 800;
        }

        .nav {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .nav a {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
        }

        .nav a:hover {
          color: white;
        }

        .nav-btn {
          padding: 8px 14px;
          border-radius: 8px;
          background: #22c55e;
          color: black !important;
          font-weight: 600;
        }

        .home {
          padding: 80px 24px;
        }

        .hero {
          max-width: 900px;
          margin: auto;
          text-align: center;
        }

        .hero h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .hero h1 span {
          color: #22c55e;
        }

        .hero-text {
          color: #9ca3af;
          font-size: 18px;
          margin-bottom: 36px;
        }

        /* ===== HERO BUTTONS ===== */
        .hero-buttons {
          display: flex;
          gap: 18px;
          justify-content: center;
        }

        .btn {
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn.primary {
          background: #22c55e;
          color: #020617;
          box-shadow: 0 8px 26px rgba(34,197,94,0.3);
        }

        .btn.primary:hover {
          background: #16a34a;
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(34,197,94,0.45);
        }

        .btn.secondary {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.45);
          color: #22c55e;
        }

        .btn.secondary:hover {
          background: rgba(34,197,94,0.18);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(34,197,94,0.25);
        }

        /* ===== SECTIONS ===== */
        .section {
          max-width: 1100px;
          margin: 100px auto;
          padding: 0 24px;
        }

        .section-title {
          text-align: center;
          font-size: 34px;
          margin-bottom: 50px;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 26px;
        }

        /* ===== CARD HOVER EFFECT ===== */
        .card {
          background: radial-gradient(circle at top, #151515, #0b0b0b);
          border: 1px solid #222;
          border-radius: 18px;
          padding: 26px;
          transition: all 0.3s ease;
        }

        .card:hover {
          border-color: #22c55e;
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(34,197,94,0.15);
        }

        .card-icon {
          font-size: 26px;
          margin-bottom: 14px;
        }

        .card h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .card p {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
        }

        .footer {
          border-top: 1px solid #222;
          padding: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }

        .footer .tech {
          margin-top: 6px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
