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

  /* ===============================
     HELPERS
  =============================== */
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
      <div className="p-8 text-white">

      {/* API KEY CARD */}
      <div className="bg-[#0b0b0b] border border-[#222] rounded-2xl p-6 max-w-xl">
        <p className="text-sm text-gray-400 mb-2">Your API Key</p>

        <div className="flex items-center justify-between bg-black border border-[#222] rounded-xl px-4 py-3">
          <span className="text-green-500 font-mono break-all">
            {show ? apiKey : maskedKey(apiKey)}
          </span>

          <div className="flex gap-2">
            <button
              onClick={toggleView}
              className="px-3 py-1 text-sm border border-[#333] rounded-lg hover:bg-[#111]"
            >
              {show ? "Hide" : "Show"}
            </button>

            <button
              onClick={copyKey}
              className="px-3 py-1 text-sm border border-[#333] rounded-lg hover:bg-[#111]"
            >
              Copy
            </button>
          </div>
        </div>

        <button
          onClick={regenerateKey}
          disabled={loading}
          className="mt-4 px-4 py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition"
        >
          {loading ? "Generating..." : "Regenerate API Key"}
        </button>

        {toast && (
          <div
            className={`mt-4 px-4 py-2 rounded-lg text-sm ${
              toast.type === "success"
                ? "border border-green-600 text-green-400 bg-green-500/10"
                : "border border-red-700 text-red-400 bg-red-500/10"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

      {/* ===============================
         CSS (SAME STYLE + BUTTON GROUP)
      =============================== */}
      <style>{`
        .api-page {
          padding: 60px;
          color: white;
          max-width: 1000px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        h1 {
          font-size: 32px;
          margin-bottom: 6px;
        }

        .subtext {
          color: #9ca3af;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .header-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #e5e7eb;
          background: #0b0b0b;
          border: 1px solid #222;
          transition: all 0.2s;
        }

        .header-btn:hover {
          background: #111;
        }

        .header-btn.active {
          background: #16a34a;
          border-color: #16a34a;
          color: white;
        }

        .key-card {
          background: #0b0b0b;
          border: 1px solid #222;
          border-radius: 18px;
          padding: 26px;
          max-width: 560px;
        }

        .label {
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 10px;
        }

        .key-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: black;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #222;
        }

        .key-text {
          color: #22c55e;
          font-family: monospace;
          word-break: break-all;
        }

        .actions button {
          background: transparent;
          border: 1px solid #333;
          color: #e5e7eb;
          padding: 6px 12px;
          border-radius: 8px;
          margin-left: 8px;
          cursor: pointer;
        }

        .actions button:hover {
          background: #111;
        }

        .regen-btn {
          margin-top: 18px;
          border: 1px solid #7f1d1d;
          color: #f87171;
          padding: 10px 16px;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
        }

        .regen-btn:hover {
          background: rgba(127,29,29,0.15);
        }

        .inline-toast {
          margin-top: 16px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          animation: slideFade 0.3s ease;
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
