"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { useAnalysis } from "@/components/text-analysis/useAnalysis";

export default function TextAnalysisPage() {
  const {
    text, setText, result, loading, error, tracked, requestCount,
    runAnalysis, clearAll, wordCount, charCount,
  } = useAnalysis();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const readings = result
    ? [
        { label: "Words", value: result.wordCount.toLocaleString() },
        { label: "Characters", value: result.charCount.toLocaleString() },
        { label: "Sentences", value: result.sentenceCount.toLocaleString() },
        { label: "Paragraphs", value: result.paragraphCount.toLocaleString() },
        { label: "Unique words", value: result.uniqueWords.toLocaleString() },
        { label: "Avg words / sentence", value: result.avgWordsPerSentence.toString() },
        { label: "Reading time", value: result.readingTime },
        { label: "Chars, no spaces", value: result.charNoSpaces.toLocaleString() },
      ]
    : [];

  return (
    <div className="ws">
      <style>{`
        .ws { display: flex; flex-direction: column; gap: 8px; }

        .ws-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-bottom: 24px; }
        .ws-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .ws-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px; line-height: 1.05;
        }
        .ws-sub { font-size: 14px; color: var(--ink-soft); }
        .ws-sub strong { color: var(--ink); font-weight: 600; }

        .ws-session { font-family: var(--font-mono); font-size: 12px; color: var(--ink-faint); }
        .ws-session strong { color: var(--brass-deep); }

        /* ── MORPHING STAGE ── */
        .morph-stage { display: flex; gap: 32px; border-top: 1px solid var(--line-strong); padding-top: 20px; align-items: flex-start; }
        @media (max-width: 960px) { .morph-stage { flex-direction: column; } }

        .morph-editor.is-full { flex: 1 1 100%; }
        .morph-editor.is-shrunk { flex: 1 1 0%; min-width: 0; }
        .morph-panel { flex: 0 0 380px; }
        @media (max-width: 960px) { .morph-panel { flex-basis: auto; width: 100%; } }

        .ws-manuscript-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
        .ws-live-count { font-family: var(--font-mono); font-size: 12px; color: var(--ink-faint); }
        .ws-live-count strong { color: var(--ink-soft); font-weight: 600; }
        .ws-manuscript-actions { display: flex; gap: 8px; }

        .ws-textarea {
          width: 100%; min-height: 320px;
          background: var(--surface); border: 1px solid var(--line);
          padding: 20px 22px;
          color: var(--ink); font-size: 15px; line-height: 1.75;
          font-family: var(--font-body);
          resize: vertical; outline: none;
          transition: border-color 0.2s ease;
        }
        .ws-textarea:focus { border-color: var(--brass); box-shadow: 0 0 0 3px var(--brass-tint); }
        .ws-textarea::placeholder { color: var(--ink-faint); }

        .ws-manuscript-foot { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); margin-top: 8px; }

        .ws-error {
          border: 1px solid var(--bad); background: var(--bad-tint);
          padding: 12px 16px; font-size: 13px; color: var(--bad);
          margin-top: 16px;
        }

        /* ── INSTRUMENT PANEL ── */
        .ws-panel-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .ws-panel-label { font-size: 11px; font-weight: 700; letter-spacing: 0.3px; color: var(--ink-faint); }

        .ws-readings { border-top: 1px solid var(--line); }
        .ws-reading-row {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 12px 2px; border-bottom: 1px solid var(--line);
        }
        .ws-reading-label { font-size: 13px; color: var(--ink-soft); }
        .ws-reading-value { font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: var(--ink); }

        .ws-sub-block { margin-top: 30px; }
        .ws-sub-title { font-size: 11px; font-weight: 700; color: var(--ink-faint); margin-bottom: 14px; border-top: 1px solid var(--line-strong); padding-top: 16px; }

        .ws-word-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
        .ws-word-row:last-child { border-bottom: none; }
        .ws-word-key { color: var(--ink-faint); }
        .ws-word-val { font-family: var(--font-mono); font-weight: 600; color: var(--ink); }

        /* ── EMPTY STATE ── */
        .ws-empty { padding: 60px 2px; text-align: center; }
        .ws-empty-title { font-family: var(--font-display); font-style: italic; font-size: 18px; color: var(--ink-faint); margin-bottom: 8px; }
        .ws-empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; max-width: 30ch; margin: 0 auto; }
      `}</style>

      {/* HEADER */}
      <div className="ws-head">
        <div>
          <div className="ws-kicker">Workspace</div>
          <h1 className="ws-title">Analyze a document</h1>
          <p className="ws-sub">
            Paste text, run <strong>Analyze</strong> — each run uses 1 request from your quota.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {requestCount > 0 && (
            <div className="ws-session">
              Requests this session — <strong>{requestCount}</strong>
            </div>
          )}
          <a href="/dashboard/text-analysis/history" className="btn btn-line" style={{ height: 34 }}>
            History
          </a>
        </div>
      </div>

      {/* MORPHING WORKSPACE */}
      <div className="morph-stage">
        <motion.div
          layout
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className={`morph-editor ${result ? "is-shrunk" : "is-full"}`}
        >
          <div className="ws-manuscript-bar">
            <span className="ws-live-count">
              <strong>{wordCount}</strong> words <span className="tick" style={{ margin: "0 8px" }} /> <strong>{charCount}</strong> characters
            </span>
            <div className="ws-manuscript-actions">
              <button className="btn btn-quiet" onClick={clearAll} disabled={!text && !result}>
                Clear
              </button>
              <button className="btn btn-brass btn-glow" onClick={runAnalysis} disabled={loading || !text.trim()}>
                {loading ? (<><span className="spinner" /> Analyzing</>) : "Analyze"}
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="ws-textarea"
            placeholder="Paste or type your text here, then click Analyze. Each run counts as 1 request against your plan quota."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />

          <div className="ws-manuscript-foot">
            <span>Each analysis = 1 request</span>
            <span>{text.length} characters</span>
          </div>

          {error && <div className="ws-error">{error}</div>}
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div
              key="panel"
              className="morph-panel"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <div className="ws-panel-head">
                <span className="ws-panel-label">Overview</span>
                {tracked && (
                  <motion.span
                    className="pill pill-brass"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 18 }}
                  >
                    <span className="pill-dot" /> Tracked
                  </motion.span>
                )}
              </div>
              <StaggerGroup className="ws-readings">
                {readings.map((r) => (
                  <StaggerItem key={r.label} className="ws-reading-row">
                    <span className="ws-reading-label">{r.label}</span>
                    <span className="ws-reading-value">{r.value}</span>
                  </StaggerItem>
                ))}
              </StaggerGroup>

              <div className="ws-sub-block">
                <div className="ws-sub-title">Word highlights</div>
                {[
                  { label: "Longest word", value: result!.longestWord },
                  { label: "Most common", value: result!.mostCommonWord },
                  { label: "Chars, no spaces", value: result!.charNoSpaces.toLocaleString() },
                ].map((r) => (
                  <div key={r.label} className="ws-word-row">
                    <span className="ws-word-key">{r.label}</span>
                    <span className="ws-word-val">{r.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!result && (
        <div className="ws-empty">
          <div className="ws-empty-title">No reading yet</div>
          <p className="ws-empty-sub">
            Write in the full-width canvas above, then click Analyze — the editor will make
            room for your results.
          </p>
        </div>
      )}
    </div>
  );
}