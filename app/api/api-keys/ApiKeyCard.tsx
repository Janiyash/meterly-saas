"use client";

import { useState } from "react";

type ApiKeyObject = {
  encryptedKey?: string;
  last4?: string;
};

type ApiKeyInput = string | ApiKeyObject;

export default function ApiKeyCard({ apiKey }: { apiKey: ApiKeyInput }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ SAFE normalization
  const resolvedKey =
    typeof apiKey === "string"
      ? apiKey
      : apiKey.encryptedKey
      ? apiKey.encryptedKey
      : `**** **** **** ${apiKey.last4 ?? ""}`;

  const maskedKey = resolvedKey.replace(/.(?=.{4})/g, "•");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resolvedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = () => {
    alert("Later this will regenerate API key via backend");
  };

  return (
    <div className="card">
      <div className="card-header">
        <strong>Your API Key</strong>
      </div>

      <div className="key-box">
        <code>{visible ? resolvedKey : maskedKey}</code>

        <button
          className="icon-btn"
          onClick={() => setVisible(!visible)}
          title="Show / Hide"
        >
          {visible ? "🙈" : "👁"}
        </button>

        <button className="icon-btn" onClick={handleCopy} title="Copy">
          📋
        </button>
      </div>

      {copied && <p className="copied">Copied to clipboard</p>}

      <button className="regen-btn" onClick={handleRegenerate}>
        Regenerate API Key
      </button>

      {/* STYLES UNCHANGED */}
      <style>{`
        .card {
          background: radial-gradient(circle at top, #151515, #0b0b0b);
          border: 1px solid #222;
          border-radius: 16px;
          padding: 24px;
          max-width: 700px;
        }
        .card-header {
          margin-bottom: 12px;
          font-size: 15px;
          color: #d1d5db;
        }
        .key-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #000;
          border: 1px solid #333;
          padding: 14px;
          border-radius: 10px;
          overflow-x: auto;
        }
        code {
          flex: 1;
          font-size: 14px;
          color: #22c55e;
          white-space: nowrap;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        }
        .icon-btn:hover {
          opacity: 0.7;
        }
        .copied {
          margin-top: 10px;
          color: #22c55e;
          font-size: 13px;
        }
        .regen-btn {
          margin-top: 18px;
          padding: 12px 18px;
          border-radius: 10px;
          border: 1px solid #ef4444;
          background: transparent;
          color: #ef4444;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .regen-btn:hover {
          background: #ef4444;
          color: white;
        }
      `}</style>
    </div>
  );
}
