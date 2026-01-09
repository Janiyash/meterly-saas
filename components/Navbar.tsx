"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = session
    ? [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Text Analysis", href: "/dashboard/text-analysis" },
        { name: "Usage", href: "/dashboard/usage" },
        { name: "API Keys", href: "/dashboard/api-keys" },
      ]
    : [];

  return (
    <header className="navbar">
      {/* LEFT: LOGO */}
      <Link href="/" className="logo">
        Meterly ⚡
      </Link>

      {/* CENTER: NAV LINKS (only if logged in) */}
      <nav className="nav-links">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* RIGHT: AUTH */}
      <div className="avatar-wrapper">
        {status === "authenticated" ? (
          <>
            <button className="avatar-btn" onClick={() => setOpen(!open)}>
              {session.user?.image ? (
                <img src={session.user.image} alt="avatar" />
              ) : (
                <div className="avatar-fallback">
                  {session.user?.email?.[0]?.toUpperCase()}
                </div>
              )}
            </button>

            {open && (
              <div className="dropdown">
                <p className="email">{session.user?.email}</p>

                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/dashboard/usage" onClick={() => setOpen(false)}>
                  Usage
                </Link>
                <Link href="/dashboard/api-keys" onClick={() => setOpen(false)}>
                  API Keys
                </Link>

                <button
                  onClick={() =>
                    signOut({ callbackUrl: "/auth/signin" })
                  }
                >
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <Link href="/auth/signin" className="nav-link">
            Login
          </Link>
        )}
      </div>

      {/* CSS (UNCHANGED) */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 32px;
          background: #0b0b0b;
          border-bottom: 1px solid #222;
        }

        .logo {
          font-size: 20px;
          font-weight: bold;
          color: white;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          gap: 22px;
        }

        .nav-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
          padding-bottom: 4px;
        }

        .nav-link:hover {
          color: white;
        }

        .nav-link.active {
          color: #22c55e;
          border-bottom: 2px solid #22c55e;
        }

        .avatar-wrapper {
          position: relative;
        }

        .avatar-btn {
          background: none;
          border: none;
          cursor: pointer;
        }

        .avatar-btn img,
        .avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          background: #22c55e;
          color: black;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .dropdown {
          position: absolute;
          right: 0;
          top: 46px;
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          min-width: 180px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dropdown a,
        .dropdown button {
          background: none;
          border: none;
          color: #e5e7eb;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          font-size: 14px;
          text-align: left;
        }

        .dropdown a:hover,
        .dropdown button:hover {
          background: #1f2937;
        }

        .email {
          font-size: 12px;
          color: #9ca3af;
          padding: 6px 8px;
          border-bottom: 1px solid #222;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
