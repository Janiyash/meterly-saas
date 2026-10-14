"use client";

import Link from "next/link";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button className="dc-copy-btn" onClick={copy}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="dc-code-wrap">
      <div className="dc-code-header">
        <span className="dc-code-lang">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="dc-code">{code}</pre>
    </div>
  );
}

const REQUEST_TABS = [
  {
    label: "cURL",
    lang: "bash",
    code: `curl -X POST https://your-domain.com/api/analyze \\
  -H "Authorization: Bearer meterly_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "text": "Your document text goes here." }'`,
  },
  {
    label: "JavaScript",
    lang: "javascript",
    code: `const res = await fetch("https://your-domain.com/api/analyze", {
  method: "POST",
  headers: {
    "Authorization": "Bearer meterly_xxxxxxxxxxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text: "Your document text goes here." }),
});

const { result } = await res.json();
console.log(result.wordCount);`,
  },
  {
    label: "Python",
    lang: "python",
    code: `import requests

response = requests.post(
    "https://your-domain.com/api/analyze",
    headers={
        "Authorization": "Bearer meterly_xxxxxxxxxxxxxxxx",
        "Content-Type": "application/json",
    },
    json={"text": "Your document text goes here."},
)

data = response.json()
print(data["result"]["wordCount"])`,
  },
];

function RequestTabs() {
  const [active, setActive] = useState(0);
  const tab = REQUEST_TABS[active];
  return (
    <div className="dc-tabs-wrap">
      <div className="dc-tabs">
        {REQUEST_TABS.map((t, i) => (
          <button
            key={t.label}
            className={`dc-tab${active === i ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock lang={tab.lang} code={tab.code} />
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="dc-page">
      <style>{`
        .dc-page { min-height: 100vh; background: var(--paper); }
        .dc-main { max-width: 760px; margin: 0 auto; padding: 96px 28px 90px; }

        .dc-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 16px; }
        .dc-title {
          font-family: var(--font-display); font-weight: 500;
          font-size: clamp(28px, 3.6vw, 38px); line-height: 1.1;
          color: var(--ink); margin-bottom: 16px;
        }
        .dc-lede { font-size: 15px; line-height: 1.65; color: var(--ink-soft); max-width: 56ch; margin-bottom: 28px; }

        .dc-endpoint {
          display: inline-flex; align-items: center; gap: 12px;
          border: 1px solid var(--line-strong); background: var(--surface);
          padding: 10px 16px; margin-bottom: 48px; border-radius: var(--radius-sm);
        }
        .dc-endpoint-path { font-family: var(--font-mono); font-size: 14px; color: var(--ink); }

        .dc-section { padding: 32px 0; border-top: 1px solid var(--line); }
        .dc-h2 {
          font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 14px;
        }
        .dc-p { font-size: 14px; line-height: 1.7; color: var(--ink-soft); margin-bottom: 16px; }
        .dc-p a { color: var(--brass-deep); text-decoration: underline; }
        .dc-p code {
          font-family: var(--font-mono); font-size: 12px;
          background: var(--surface); padding: 1px 5px; border: 1px solid var(--line);
        }

        /* code block */
        .dc-code-wrap { border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; margin-top: 12px; }
        .dc-code-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 7px 14px; background: var(--surface-dim);
          border-bottom: 1px solid var(--line);
        }
        .dc-code-lang { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
        .dc-code {
          background: var(--surface); padding: 18px 20px;
          font-family: var(--font-mono); font-size: 12.5px;
          line-height: 1.75; color: var(--ink-soft);
          overflow-x: auto; white-space: pre; margin: 0;
        }

        /* copy button */
        .dc-copy-btn {
          background: none; border: 1px solid var(--line-strong);
          color: var(--ink-faint); font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; padding: 3px 9px;
          border-radius: var(--radius-sm); cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .dc-copy-btn:hover { border-color: var(--brass); color: var(--brass-deep); }

        /* request tabs */
        .dc-tabs-wrap { margin-top: 12px; }
        .dc-tabs {
          display: flex; gap: 0;
          border-bottom: 1px solid var(--line);
          margin-bottom: 0;
        }
        .dc-tab {
          background: none; border: none; border-bottom: 2px solid transparent;
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          color: var(--ink-faint); cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          margin-bottom: -1px;
        }
        .dc-tab:hover { color: var(--ink-soft); }
        .dc-tab.active { color: var(--brass-deep); border-bottom-color: var(--brass); }
        .dc-tabs-wrap .dc-code-wrap { border-top: none; border-radius: 0 0 var(--radius-sm) var(--radius-sm); }

        /* errors ledger */
        .dc-ledger { border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; margin-top: 12px; }
        .dc-ledger-row {
          display: grid; grid-template-columns: 72px 1fr;
          padding: 12px 16px; border-bottom: 1px solid var(--line);
          font-size: 13px; align-items: center; gap: 16px;
        }
        .dc-ledger-row:last-child { border-bottom: none; }
        .dc-status {
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          padding: 3px 8px; border-radius: var(--radius-sm); text-align: center;
        }
        .dc-status-401 { background: var(--bad-tint); color: var(--bad); }
        .dc-status-400 { background: var(--bad-tint); color: var(--bad); }
        .dc-status-429 { background: rgba(251,191,36,0.1); color: #fbbf24; }
        .dc-ledger-desc { font-size: 13px; color: var(--ink-soft); }
        .dc-ledger-desc code {
          font-family: var(--font-mono); font-size: 11px;
          background: var(--surface-dim); padding: 1px 5px;
          border: 1px solid var(--line); border-radius: 2px;
        }
      `}</style>

      <main className="dc-main">
        <p className="dc-kicker">API reference</p>
        <h1 className="dc-title">Call the analysis endpoint.</h1>
        <p className="dc-lede">
          One endpoint, one job: send text, get metrics back. Every call is
          counted against your plan's monthly request limit.
        </p>
        <div className="dc-endpoint">
          <span className="pill pill-brass">POST</span>
          <span className="dc-endpoint-path">/api/analyze</span>
        </div>

        <section className="dc-section">
          <h2 className="dc-h2">Authentication</h2>
          <p className="dc-p">
            Generate a key from{" "}
            <Link href="/dashboard/api-keys">API keys</Link> and send it as a
            bearer token on every request.
          </p>
          <CodeBlock
            lang="bash"
            code={`Authorization: Bearer meterly_xxxxxxxxxxxxxxxx`}
          />
        </section>

        <section className="dc-section">
          <h2 className="dc-h2">Request</h2>
          <RequestTabs />
        </section>

        <section className="dc-section">
          <h2 className="dc-h2">Response</h2>
          <CodeBlock
            lang="json"
            code={`{
  "result": {
    "wordCount": 128,
    "charCount": 743,
    "sentenceCount": 9,
    "paragraphCount": 3,
    "avgWordsPerSentence": 14,
    "readingTime": "1 min",
    "uniqueWords": 91,
    "longestWord": "infrastructure",
    "mostCommonWord": "usage",
    "fleschScore": 62,
    "readabilityLabel": "Standard",
    "topWords": [ { "word": "usage", "count": 4 } ]
  },
  "tracked": true,
  "analysisId": "cly3x..."
}`}
          />
        </section>

        <section className="dc-section">
          <h2 className="dc-h2">Errors</h2>
          <div className="dc-ledger">
            <div className="dc-ledger-row">
              <span className="dc-status dc-status-401">401</span>
              <span className="dc-ledger-desc">No valid session or API key.</span>
            </div>
            <div className="dc-ledger-row">
              <span className="dc-status dc-status-400">400</span>
              <span className="dc-ledger-desc">
                Missing or empty <code>text</code> field.
              </span>
            </div>
            <div className="dc-ledger-row">
              <span className="dc-status dc-status-429">429</span>
              <span className="dc-ledger-desc">
                Monthly quota exceeded for the current plan.
              </span>
            </div>
          </div>
        </section>

        <section className="dc-section">
          <h2 className="dc-h2">Rate limits</h2>
          <p className="dc-p">
            Each plan has a monthly request ceiling — Free: 200, Pro: 2,000,
            Enterprise: unlimited. See <Link href="/pricing">pricing</Link> for
            details, or check remaining quota any time on your{" "}
            <Link href="/dashboard">dashboard</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}