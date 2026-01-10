"use client";

import { useEffect, useState } from "react";

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "danger";
  } | null>(null);

  function showToast(message: string, type: "success" | "danger") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  }

  function maskedKey(key: string | null) {
    if (!key) return "••••••••••••••••••••••••";
    return "••••••••••••••••••••" + key.slice(-4);
  }

  async function fetchKey() {
    const res = await fetch("/api/api-keys");
    const data = await res.json();
    if (data?.apiKey) setApiKey(data.apiKey);
  }

  function toggleView() {
    setShow((v) => !v);
    showToast(show ? "API key hidden" : "API key revealed", "success");
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    showToast("API key copied", "success");
  }

  async function regenerateKey() {
    if (!confirm("Regenerate API key? Old key will stop working.")) return;
    setLoading(true);
    const res = await fetch("/api/api-keys", { method: "PUT" });
    const data = await res.json();
    setApiKey(data.apiKey);
    setShow(true);
    setLoading(false);
    showToast("New API key generated", "danger");
  }

  useEffect(() => {
    fetchKey();
  }, []);

  return (
    <div className="api-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <h1>API Keys</h1>
        <p>Manage and secure your API credentials</p>
      </div>

      {/* CARD */}
      <div className="key-card">
        <p className="label">Your API Key</p>

        <div className="key-box">
          <span className="key-text">
            {show ? apiKey : maskedKey(apiKey)}
          </span>

          <div className="actions">
            <button onClick={toggleView}>
              {show ? "Hide" : "Show"}
            </button>
            <button onClick={copyKey}>Copy</button>
          </div>
        </div>

        <div className="divider" />

        <button
          onClick={regenerateKey}
          disabled={loading}
          className="regen-btn"
        >
          {loading ? "Generating..." : "Regenerate API Key"}
        </button>

        {toast && (
          <div className={`inline-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        .api-page {
          padding: 30px 40px;
          color: white;
          max-width: 1100px;
        }

        /* HEADER */
        .page-header {
          margin-bottom: 20px;
        }

        .page-header h1 {
          font-size: 30px;
          margin-bottom: 4px;
        }

        .page-header p {
          color: #9ca3af;
          font-size: 15px;
        }

        /* CARD */
        .key-card {
          background: linear-gradient(180deg, #0d0d0d, #090909);
          border: 1px solid #222;
          border-radius: 20px;
          padding: 28px;
          max-width: 620px;
          box-shadow: 0 0 0 1px rgba(34,197,94,0.05),
                      0 20px 40px rgba(0,0,0,0.6);
        }

        .label {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .key-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #000;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid #222;
        }

        .key-text {
          color: #22c55e;
          font-family: monospace;
          font-size: 15px;
          word-break: break-all;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .actions button {
          background: #0b0b0b;
          border: 1px solid #333;
          color: #e5e7eb;
          padding: 6px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .actions button:hover {
          background: #111;
          border-color: #444;
        }

        .divider {
          height: 1px;
          background: #222;
          margin: 22px 0;
        }

        .regen-btn {
          width: 100%;
          border: 1px solid #7f1d1d;
          color: #f87171;
          padding: 12px 16px;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .regen-btn:hover {
          background: rgba(127,29,29,0.18);
        }

        .regen-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* TOAST */
        .inline-toast {
          margin-top: 18px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          animation: slideFade 0.25s ease;
        }

        .inline-toast.success {
          border: 1px solid #22c55e;
          color: #22c55e;
          background: rgba(34,197,94,0.08);
        }

        .inline-toast.danger {
          border: 1px solid #7f1d1d;
          color: #f87171;
          background: rgba(127,29,29,0.15);
        }

        @keyframes slideFade {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
