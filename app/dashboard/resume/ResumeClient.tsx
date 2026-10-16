"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Result {
  atsScore: number;
  summary: string;
  sections: Record<string, boolean>;
  keywords: string[];
  suggestions: string[];
  strengths: string[];
  jobTitles: string[];
  experienceLevel: string;
  wordCount: number;
}

interface HistoryItem {
  id: string;
  fileName: string;
  atsScore: number;
  createdAt: string;
  summary: string;
}

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "var(--brass)" : score >= 50 ? "#fbbf24" : "var(--bad)";

  return (
    <div className="score-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <motion.circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={circ}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          transform="rotate(-90 65 65)"
        />
        <text x="65" y="60" textAnchor="middle" fill="var(--ink)" fontSize="28" fontWeight="700" fontFamily="monospace">{score}</text>
        <text x="65" y="78" textAnchor="middle" fill="var(--ink-faint)" fontSize="11">/100 ATS</text>
      </svg>
      <span className="score-label" style={{ color }}>
        {score >= 75 ? "Strong" : score >= 50 ? "Average" : "Weak"}
      </span>
    </div>
  );
}

const sectionLabels: Record<string, string> = {
  contact: "Contact info",
  summary: "Summary / Objective",
  experience: "Work experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
};

export default function ResumeClient({ history }: { history: HistoryItem[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const STEPS = [
    "Uploading your resume",
    "Extracting text and structure",
    "Checking sections and keywords",
    "Calculating your ATS score",
    "Preparing suggestions",
  ];

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body: fd });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // server returned non-JSON (e.g. platform timeout page)
        throw new Error("The server took too long to respond. Please try again.");
      }
      if (!res.ok) throw new Error(data?.error ?? "Analysis failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  return (
    <div className="rp">
      <style>{`
        .rp-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .rp-title { font-family: var(--font-display); font-style: italic; font-weight: 500; font-size: clamp(26px,3.2vw,34px); color: var(--ink); margin-bottom: 8px; }
        .rp-sub { font-size: 14px; color: var(--ink-soft); margin-bottom: 32px; }

        .rp-drop {
          border: 1px dashed var(--line-strong); border-radius: var(--radius-sm);
          padding: 48px 24px; text-align: center; cursor: pointer;
          transition: border-color 0.2s, background 0.2s; margin-bottom: 16px;
          background: var(--surface);
        }
        .rp-drop.drag { border-color: var(--brass); background: var(--brass-tint); }
        .rp-drop-icon { font-size: 32px; margin-bottom: 12px; }
        .rp-drop-title { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
        .rp-drop-sub { font-size: 13px; color: var(--ink-faint); }
        .rp-drop-sub span { color: var(--brass-deep); font-weight: 600; cursor: pointer; }

        .rp-file-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 13px;
        }
        .rp-file-name { font-family: var(--font-mono); color: var(--ink-soft); }
        .rp-file-remove { background: none; border: none; color: var(--ink-faint); cursor: pointer; font-size: 16px; transition: color 0.15s; }
        .rp-file-remove:hover { color: var(--bad); }

        .rp-error { background: var(--bad-tint); border: 1px solid var(--bad); padding: 12px 16px; font-size: 13px; color: var(--bad); margin-bottom: 16px; border-radius: var(--radius-sm); }

        .rp-steps { padding: 24px 0; display: flex; flex-direction: column; gap: 12px; max-width: 360px; }
        .rp-step { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--ink-faint); opacity: 0.5; transition: opacity .3s; }
        .rp-step.active, .rp-step.done { opacity: 1; }
        .rp-step.active { color: var(--ink); }
        .rp-step.done { color: var(--brass); }
        .rp-step-dot { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 50%; font-size: 11px; flex-shrink: 0; }
        .rp-loading { padding: 32px 0; text-align: center; color: var(--ink-faint); font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 10px; }

        /* results */
        .rp-results { margin-top: 32px; }
        .rp-results-top {
          display: flex; gap: 32px; align-items: flex-start;
          flex-wrap: wrap; margin-bottom: 28px;
          padding-bottom: 28px; border-bottom: 1px solid var(--line);
        }

        .score-ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
        .score-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }

        .rp-results-meta { flex: 1; min-width: 200px; padding-top: 4px; }
        .rp-summary-text { font-size: 13px; color: var(--ink-soft); line-height: 1.7; margin-bottom: 14px; }
        .rp-exp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--brass-deep);
          background: var(--brass-tint); border: 1px solid rgba(52,211,153,0.2);
          padding: 4px 12px; border-radius: var(--radius-pill);
        }

        .rp-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; margin-top: 24px;
        }

        /* sections grid */
        .rp-sections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
        .rp-section-item {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-radius: var(--radius-sm);
          font-size: 12px; font-weight: 600; border: 1px solid var(--line);
        }
        .rp-section-item.found { background: var(--brass-tint); border-color: rgba(52,211,153,0.2); color: var(--brass-deep); }
        .rp-section-item.missing { background: var(--surface); color: var(--ink-faint); }
        .rp-section-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .rp-section-item.found .rp-section-dot { background: var(--brass); }
        .rp-section-item.missing .rp-section-dot { background: var(--line-strong); }

        /* keywords */
        .rp-keywords { display: flex; flex-wrap: wrap; gap: 6px; }
        .rp-keyword {
          font-family: var(--font-mono); font-size: 11px;
          background: var(--surface); border: 1px solid var(--line);
          color: var(--ink-soft); padding: 3px 9px; border-radius: var(--radius-sm);
        }
        .rp-keyword-highlight {
          font-family: var(--font-mono); font-size: 11px;
          background: var(--brass-tint); border: 1px solid rgba(52,211,153,0.3);
          color: var(--brass-deep); padding: 3px 9px; border-radius: var(--radius-sm);
        }

        /* suggestions / strengths */
        .rp-list { border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
        .rp-list-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 13px 16px; border-bottom: 1px solid var(--line);
          font-size: 13px; color: var(--ink-soft); line-height: 1.5;
        }
        .rp-list-item:last-child { border-bottom: none; }
        .rp-list-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .rp-list-icon.warn { color: #fbbf24; }
        .rp-list-icon.good { color: var(--brass); }

        /* history */
        .rp-history { margin-top: 40px; border-top: 1px solid var(--line); padding-top: 28px; }
        .rp-history-head {
          display: grid; grid-template-columns: 1fr 80px 120px;
          padding: 8px 0; border-bottom: 1px solid var(--line-strong);
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-faint); gap: 16px;
        }
        .rp-history-row {
          display: grid; grid-template-columns: 1fr 80px 120px;
          padding: 12px 0; border-bottom: 1px solid var(--line);
          font-size: 13px; align-items: center; gap: 16px;
        }
        .rp-history-row:last-child { border-bottom: none; }
        .rp-history-name { font-family: var(--font-mono); font-size: 12px; color: var(--ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rp-history-score { font-family: var(--font-mono); font-weight: 700; color: var(--brass-deep); }
        .rp-history-date { font-size: 11px; color: var(--ink-faint); }
      `}</style>

      <div className="rp-kicker">AI Tools</div>
      <h1 className="rp-title">Resume analyzer</h1>
      <p className="rp-sub">
        Upload your resume and get an AI-powered ATS score, keyword analysis, strengths, and actionable suggestions.
      </p>

      {/* dropzone */}
      <div
        className={`rp-drop${dragging ? " drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="rp-drop-icon">📄</div>
        <div className="rp-drop-title">Drop your resume here</div>
        <div className="rp-drop-sub">
          PDF, DOC, DOCX or TXT · <span>Browse files</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="rp-file-row">
          <span className="rp-file-name">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            className="rp-file-remove"
            onClick={() => { setFile(null); setResult(null); setError(null); }}
          >
            ✕
          </button>
        </div>
      )}

      {error && <div className="rp-error">{error}</div>}

      {file && !loading && !result && (
        <button className="btn btn-brass btn-glow" onClick={analyze}>
          Analyze resume
        </button>
      )}

      {loading && (
        <div className="rp-steps" role="status" aria-live="polite">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`rp-step ${i < step ? "done" : i === step ? "active" : ""}`}
            >
              <span className="rp-step-dot">
                {i < step ? "✓" : i === step ? <span className="spinner" /> : ""}
              </span>
              {label}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            className="rp-results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* score + summary */}
            <div className="rp-results-top">
              <ScoreRing score={result.atsScore} />
              <div className="rp-results-meta">
                <p className="rp-summary-text">{result.summary}</p>
                {result.experienceLevel && (
                  <span className="rp-exp-badge">
                    {result.experienceLevel} level
                  </span>
                )}
              </div>
            </div>

            {/* sections */}
            <div className="rp-section-label">Sections detected</div>
            <div className="rp-sections-grid">
              {Object.entries(result.sections).map(([key, found]) => (
                <div key={key} className={`rp-section-item ${found ? "found" : "missing"}`}>
                  <span className="rp-section-dot" />
                  {sectionLabels[key] ?? key}
                </div>
              ))}
            </div>

            {/* job titles */}
            {result.jobTitles?.length > 0 && (
              <>
                <div className="rp-section-label">Best suited for</div>
                <div className="rp-keywords">
                  {result.jobTitles.map((t) => (
                    <span key={t} className="rp-keyword-highlight">{t}</span>
                  ))}
                </div>
              </>
            )}

            {/* keywords */}
            {result.keywords?.length > 0 && (
              <>
                <div className="rp-section-label">
                  Tech skills & keywords detected ({result.keywords.length})
                </div>
                <div className="rp-keywords">
                  {result.keywords.map((k) => (
                    <span key={k} className="rp-keyword">{k}</span>
                  ))}
                </div>
              </>
            )}

            {/* strengths */}
            {result.strengths?.length > 0 && (
              <>
                <div className="rp-section-label">What you're doing well</div>
                <div className="rp-list">
                  {result.strengths.map((s, i) => (
                    <div key={i} className="rp-list-item">
                      <span className="rp-list-icon good">✓</span>
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* suggestions */}
            {result.suggestions?.length > 0 && (
              <>
                <div className="rp-section-label">Suggestions to improve</div>
                <div className="rp-list">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="rp-list-item">
                      <span className="rp-list-icon warn">⚠</span>
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* re-analyze button */}
            <div style={{ marginTop: 24 }}>
              <button
                className="btn btn-line"
                onClick={() => { setResult(null); setFile(null); }}
              >
                Analyze another resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* history */}
      {history.length > 0 && (
        <div className="rp-history">
          <div className="rp-section-label" style={{ marginTop: 0 }}>Recent analyses</div>
          <div className="rp-history-head">
            <span>File</span><span>Score</span><span>Date</span>
          </div>
          {history.map((h) => (
            <div key={h.id} className="rp-history-row">
              <span className="rp-history-name">{h.fileName}</span>
              <span className="rp-history-score">{h.atsScore}/100</span>
              <span className="rp-history-date">
                {new Date(h.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}