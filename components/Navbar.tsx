"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);


  const navLinks = session
    ? [
        { name: "Overview", href: "/dashboard" },
        { name: "Analyze", href: "/dashboard/text-analysis" },
        { name: "Resume", href: "/dashboard/resume" },
        { name: "Usage", href: "/dashboard/usage" },
        { name: "Keys", href: "/dashboard/api-keys" },
        { name: "Pricing", href: "/pricing" },
        { name: "Docs", href: "/docs" },
      ]
    : [
        { name: "Pricing", href: "/pricing" },
        { name: "Docs", href: "/docs" },
      ];

  return (
    <>
      <Link href="/" className="dock-mark">
        <span className="dock-mark-glyph" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 12 L4 6 L7 10 L10 3 L15 12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Meterly
      </Link>

      <nav className="dock" aria-label="Primary">
        <div className="dock-inner">
          <div className="dock-links">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className="dock-item">
                  {active && (
                    <motion.span
                      className="dock-active"
                      layoutId="dock-active"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="dock-item-label">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <span className="dock-sep" />

          {status === "authenticated" ? (
            <div className="dock-account" ref={dropRef}>
              <button
                className="dock-avatar-btn"
                onClick={() => setOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={open}
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" width={26} height={26} />
                ) : (
                  <span className="dock-avatar-fallback">
                    {session.user?.email?.[0]?.toUpperCase()}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    className="dock-drop"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* user info */}
                    <div className="drop-user">
                      <div className="drop-avatar">
                        {session.user?.image
                          ? <img src={session.user.image} alt="" width={32} height={32} />
                          : <span className="drop-avatar-fb">{session.user?.email?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="drop-user-info">
                        <span className="drop-name">{session.user?.name ?? "Account"}</span>
                        <span className="drop-email">{session.user?.email}</span>
                      </div>
                    </div>

                    <div className="drop-divider" />

                    <Link href="/dashboard" className="drop-item" onClick={() => setOpen(false)}>
                      <span className="drop-icon">⊞</span> Overview
                    </Link>
                    <Link href="/dashboard/billing" className="drop-item" onClick={() => setOpen(false)}>
                      <span className="drop-icon">◈</span> Billing
                    </Link>
                    <Link href="/dashboard/settings" className="drop-item" onClick={() => setOpen(false)}>
                      <span className="drop-icon">◎</span> Settings
                    </Link>

                    <div className="drop-divider" />

                    <button
                      className="drop-item drop-signout"
                      onClick={() => { setOpen(false); signOut({ callbackUrl: "/auth/signin" }); }}
                    >
                      <span className="drop-icon">→</span> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth/signin" className="dock-item dock-item-cta">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <style>{`
        .dock-mark {
          position: fixed; top: 20px; left: 20px; z-index: 60;
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-display); font-style: italic; font-size: 16px; font-weight: 500;
          color: var(--ink); text-decoration: none;
          padding: 6px 10px 6px 8px;
          background: color-mix(in srgb, var(--paper) 70%, transparent);
          backdrop-filter: blur(10px);
          border: 1px solid var(--line);
          border-radius: var(--radius-pill);
        }
        .dock-mark-glyph { color: var(--brass); display: inline-flex; }

        .dock {
          position: fixed; left: 50%; top: 20px; transform: translateX(-50%);
          z-index: 60; max-width: calc(100vw - 24px);
        }
        .dock-inner {
          display: flex; align-items: center; gap: 2px;
          padding: 6px; border-radius: var(--radius-pill);
          background: color-mix(in srgb, var(--surface) 72%, transparent);
          backdrop-filter: blur(16px) saturate(1.4);
          border: 1px solid var(--line-strong);
          box-shadow: 0 12px 40px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(52,211,153,0.04);
          overflow: visible;
          max-width: 100%;
        }

        /* Only this inner strip scrolls horizontally on small screens.
           Keeping overflow off .dock-inner itself means the account
           dropdown (which sits outside this strip) is never clipped. */
        .dock-links {
          display: flex; align-items: center; gap: 2px;
          overflow-x: auto; scrollbar-width: none;
          min-width: 0;
        }
        .dock-links::-webkit-scrollbar { display: none; }

        .dock-item {
          position: relative; display: inline-flex; align-items: center;
          padding: 9px 16px; border-radius: var(--radius-pill);
          font-size: 12.5px; font-weight: 600; color: var(--ink-faint);
          text-decoration: none; white-space: nowrap; transition: color 0.15s ease;
        }
        .dock-item:hover { color: var(--ink); }
        .dock-active {
          position: absolute; inset: 0; background: var(--ink);
          border-radius: var(--radius-pill); z-index: -1;
        }
        .dock-item:has(.dock-active) { color: var(--paper); }
        .dock-item-cta { background: var(--brass); color: #06110c; font-weight: 700; }
        .dock-item-cta:hover { color: #06110c; background: var(--brass-deep); }

        .dock-sep { width: 1px; height: 20px; background: var(--line-strong); margin: 0 4px; flex-shrink: 0; }

        .dock-account { position: relative; flex-shrink: 0; }
        .dock-avatar-btn {
          background: none; border: none; cursor: pointer;
          padding: 2px; display: flex; border-radius: 50%;
          transition: box-shadow 0.15s;
        }
        .dock-avatar-btn:hover { box-shadow: 0 0 0 2px var(--brass); }
        .dock-avatar-btn img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
        .dock-avatar-fallback {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--brass-tint); border: 1px solid var(--brass);
          color: var(--brass-deep); display: flex; align-items: center;
          justify-content: center; font-size: 11px; font-weight: 700;
        }

        /* DROPDOWN */
        .dock-drop {
          position: absolute; right: 0; top: calc(100% + 10px);
          width: 220px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          box-shadow: 0 16px 48px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,211,153,0.06);
          overflow: hidden;
          z-index: 100;
        }

        .drop-user {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 14px 12px;
        }
        .drop-avatar img, .drop-avatar-fb {
          width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
          background: var(--brass-tint); border: 1px solid var(--brass);
          color: var(--brass-deep); display: flex; align-items: center;
          justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;
        }
        .drop-user-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .drop-name { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .drop-email { font-size: 11px; color: var(--ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .drop-divider { height: 1px; background: var(--line); margin: 0; }

        .drop-item {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 14px; font-size: 13px; color: var(--ink-soft);
          text-decoration: none; cursor: pointer;
          background: none; border: none; width: 100%; text-align: left;
          transition: background 0.12s, color 0.12s;
        }
        .drop-item:hover { background: var(--surface-dim); color: var(--ink); }
        .drop-icon { font-size: 14px; color: var(--ink-faint); width: 16px; text-align: center; }
        .drop-signout { color: var(--ink-faint); }
        .drop-signout:hover { color: var(--bad); background: var(--bad-tint); }

        @media (max-width: 640px) {
          .dock-mark { top: 14px; left: 14px; font-size: 14px; }
          .dock { top: 14px; }
          .dock-item { padding: 8px 12px; font-size: 12px; }
          .dock-drop { right: -8px; width: 200px; }
        }
      `}</style>
    </>
  );
}