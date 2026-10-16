"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ApiKeyRequiredModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="akm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <style>{`
            .akm-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
            .akm-card { width: 100%; max-width: 440px; background: var(--surface); border: 1px solid var(--line-strong); border-top: 2px solid var(--bad); border-radius: 6px; padding: 28px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
            .akm-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--bad-tint); color: var(--bad); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; }
            .akm-title { font-family: var(--font-display); font-size: 22px; color: var(--ink); margin: 0 0 8px; }
            .akm-text { font-size: 14px; line-height: 1.6; color: var(--ink-soft); margin: 0 0 20px; }
            .akm-steps { margin: 0 0 24px; padding: 12px 16px; background: var(--surface-dim); border: 1px solid var(--line); border-radius: 4px; font-size: 13px; color: var(--ink-soft); line-height: 1.8; }
            .akm-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
            .akm-secondary { background: transparent; border: 1px solid var(--line-strong); color: var(--ink-soft); padding: 10px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; }
            .akm-secondary:hover { color: var(--ink); border-color: var(--ink-faint); }
            .akm-primary { background: var(--brass); color: #04110b; padding: 10px 18px; border-radius: 4px; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block; }
            .akm-primary:hover { background: var(--brass-deep); }
          `}</style>
          <motion.div
            className="akm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="akm-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="akm-icon" aria-hidden>!</div>
            <h2 className="akm-title" id="akm-title">API key required</h2>
            <p className="akm-text">
              You need an active API key to run analyses. Your account currently has no
              active key, so this request was not processed and no usage was counted.
            </p>
            <div className="akm-steps">
              1. Open the API Keys page<br />
              2. Click “Generate new key”<br />
              3. Come back and run your analysis again
            </div>
            <div className="akm-actions">
              <button className="akm-secondary" onClick={onClose}>Maybe later</button>
              <Link className="akm-primary" href="/dashboard/api-keys" onClick={onClose}>
                Go to API keys
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
