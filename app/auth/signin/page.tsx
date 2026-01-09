"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="auth-wrapper">
      <div className="bg-gradient" />
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />

      <div className="auth-card">
        <div className="brand">
          <span className="logo">⚡</span>
          <h1>Meterly</h1>
        </div>

        <p className="subtitle">
          Sign in to access your usage analytics & billing dashboard
        </p>

        {/* ✅ GOOGLE SIGN IN */}
        <button
          className="google-btn"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/dashboard",
            })
          }
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="google-icon"
          />
          <span>Sign in with Google</span>
        </button>

        <p className="trust">
          Secure Google authentication · No passwords required
        </p>

        <Link href="/" className="back">
          ← Back to Home
        </Link>
      </div>

      <style>{`
        .auth-wrapper {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          overflow: hidden;
          color: white;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 25% 25%, rgba(34,197,94,0.2), transparent 45%),
            radial-gradient(circle at 75% 75%, rgba(34,197,94,0.15), transparent 50%);
        }

        .bg-blob {
          position: absolute;
          width: 460px;
          height: 460px;
          background: radial-gradient(circle, rgba(34,197,94,0.4), transparent 70%);
          filter: blur(140px);
          opacity: 0.75;
          animation: float 14s ease-in-out infinite;
        }

        .blob-1 {
          top: -140px;
          left: -140px;
        }

        .blob-2 {
          bottom: -160px;
          right: -160px;
          animation-delay: 7s;
        }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-50px); }
          100% { transform: translateY(0); }
        }

        .auth-card {
          position: relative;
          z-index: 1;
          max-width: 480px;
          width: 100%;
          padding: 44px;
          background: rgba(15,15,15,0.85);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(18px);
          box-shadow: 0 35px 90px rgba(0,0,0,0.85);
          text-align: center;
        }

        .brand {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .logo {
          font-size: 34px;
        }

        .brand h1 {
          font-size: 36px;
          font-weight: 900;
        }

        .subtitle {
          font-size: 18px;
          color: #cbd5f5;
          margin-bottom: 34px;
          line-height: 1.6;
        }

        /* ✅ GOOGLE BUTTON */
        .google-btn {
          width: 100%;
          padding: 18px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          background: #ffffff;
          color: #000;
          display: flex;
          justify-content: center;
          gap: 14px;
          align-items: center;
          transition: all 0.25s ease;
        }

        .google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          background: #f9fafb;
        }

        .google-btn:active {
          transform: scale(0.98);
        }

        .google-icon {
          width: 22px;
          height: 22px;
        }

        .trust {
          margin-top: 22px;
          font-size: 14px;
          color: #9ca3af;
        }

        .back {
          display: inline-block;
          margin-top: 30px;
          font-size: 14px;
          color: #22c55e;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
