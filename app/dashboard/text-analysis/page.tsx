"use client";

import { useState } from "react";

type AnalysisResult = {
  wordCount: number;
  characterCount: number;
  sentiment: "positive" | "negative" | "neutral";
};

export default function TextAnalysisPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageToast, setUsageToast] = useState(false);

  async function handleAnalyze() {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/text-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setResult(data.result);

      // 🔥 Usage toast animation
      setUsageToast(true);
      setTimeout(() => setUsageToast(false), 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div className="header">
        <h1>Text Analysis</h1>
        <p>Analyze text content using Meterly APIs</p>
      </div>

      {/* INPUT CARD */}
      <div className="card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here..."
        />

        <button
          className={`btn ${loading ? "loading" : ""}`}
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Text"}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {/* RESULT */}
      {result && (
        <div className="card result animate-in">
          <h3>Analysis Result</h3>

          <div className="result-grid">
            <div>
              <span>Words</span>
              <strong>{result.wordCount}</strong>
            </div>

            <div>
              <span>Characters</span>
              <strong>{result.characterCount}</strong>
            </div>

            <div>
              <span>Sentiment</span>
              <strong className={`sentiment ${result.sentiment}`}>
                {result.sentiment}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 API USAGE TOAST */}
      <div className={`usage-toast ${usageToast ? "show" : ""}`}>
        +1 API usage recorded
      </div>

      {/* ===================== STYLES ===================== */}
      <style>{`
        .page {
          padding: 40px;
          color: white;
          background: #000;
          min-height: 100vh;
        }

        .header {
          margin-bottom: 28px;
        }

        .header p {
          color: #9ca3af;
          margin-top: 6px;
        }

        .card {
          background: #0b0b0b;
          border: 1px solid #222;
          border-radius: 16px;
          padding: 24px;
          max-width: 720px;
        }

        textarea {
          width: 100%;
          height: 160px;
          background: #000;
          color: white;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
          resize: vertical;
        }

        textarea:focus {
          border-color: #22c55e;
          outline: none;
        }

        .btn {
          margin-top: 16px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: black;
          padding: 12px 22px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(34,197,94,0.25);
        }

        .btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error {
          margin-top: 12px;
          color: #ef4444;
        }

        .result {
          margin-top: 24px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .result-grid div {
          background: #000;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .result-grid span {
          display: block;
          font-size: 12px;
          color: #9ca3af;
        }

        .result-grid strong {
          font-size: 20px;
          margin-top: 6px;
          display: block;
        }

        .sentiment.positive { color: #22c55e; }
        .sentiment.negative { color: #ef4444; }
        .sentiment.neutral { color: #facc15; }

        /* ANIMATIONS */
        .animate-in {
          animation: slideUp 0.35s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* TOAST */
        .usage-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(34,197,94,0.15);
          border: 1px solid #22c55e;
          color: #22c55e;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 14px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.35s ease;
        }

        .usage-toast.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
