import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/motion/Reveal";

interface StoredResult {
  wordCount: number; charCount: number; charNoSpaces: number;
  sentenceCount: number; paragraphCount: number; avgWordsPerSentence: number;
  readingTime: string; uniqueWords: number; longestWord: string;
  mostCommonWord: string; fleschScore: number; readabilityLabel: string;
  topWords: { word: string; count: number }[];
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const record = await prisma.analysis.findUnique({ where: { id } });
  if (!record || record.userId !== userId) notFound();

  const result = record.result as unknown as StoredResult;

  const readings = [
    { label: "Words", value: result.wordCount.toLocaleString() },
    { label: "Characters", value: result.charCount.toLocaleString() },
    { label: "Sentences", value: result.sentenceCount.toLocaleString() },
    { label: "Paragraphs", value: result.paragraphCount.toLocaleString() },
    { label: "Unique words", value: result.uniqueWords.toLocaleString() },
    { label: "Avg words / sentence", value: result.avgWordsPerSentence.toString() },
    { label: "Reading time", value: result.readingTime },
    { label: "Longest word", value: result.longestWord },
    { label: "Most common word", value: result.mostCommonWord },
  ];

  return (
    <div>
      <style>{`
        .hd-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .hd-back { font-size: 12px; color: var(--ink-faint); text-decoration: none; }
        .hd-back:hover { color: var(--ink); }
        .hd-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(22px, 2.8vw, 28px); color: var(--ink); margin: 10px 0 6px;
        }
        .hd-date { font-size: 13px; color: var(--ink-soft); margin-bottom: 28px; }

        .hd-grid { display: grid; grid-template-columns: 1fr 320px; gap: 40px; border-top: 1px solid var(--line-strong); padding-top: 24px; }
        @media (max-width: 880px) { .hd-grid { grid-template-columns: 1fr; } }

        .hd-preview-label { font-size: 11px; font-weight: 700; color: var(--ink-faint); margin-bottom: 10px; }
        .hd-preview-text {
          font-size: 15px; line-height: 1.75; color: var(--ink-soft);
          background: var(--surface); border: 1px solid var(--line); padding: 20px 22px;
          white-space: pre-wrap; word-break: break-word;
          max-height: 520px; overflow-y: auto;
        }

        .hd-readings { border-top: 1px solid var(--line); }
        .hd-reading-row { display: flex; justify-content: space-between; padding: 11px 2px; border-bottom: 1px solid var(--line); font-size: 13px; }
        .hd-reading-label { color: var(--ink-soft); }
        .hd-reading-value { font-family: var(--font-mono); font-weight: 600; color: var(--ink); }

        .hd-flesch { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line-strong); }
        .hd-flesch-score { font-family: var(--font-mono); font-size: 32px; font-weight: 600; color: var(--brass); }
        .hd-flesch-label { font-size: 13px; font-weight: 700; color: var(--brass); }
      `}</style>

      <Link href="/dashboard/text-analysis/history" className="hd-back">← Back to history</Link>
      <Reveal>
      <div className="hd-kicker" style={{ marginTop: 16 }}>Saved analysis</div>
      <h1 className="hd-title">{record.preview || "(empty document)"}…</h1>
      <div className="hd-date">
        {new Date(record.createdAt).toLocaleString("en-US", {
          month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
        })}
      </div>

      <div className="hd-grid">
        <div>
          <div className="hd-preview-label">Full text</div>
          <div className="hd-preview-text">{record.fullText || record.preview}</div>
        </div>

        <div>
          <div className="hd-readings">
            {readings.map((r) => (
              <div key={r.label} className="hd-reading-row">
                <span className="hd-reading-label">{r.label}</span>
                <span className="hd-reading-value">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="hd-flesch">
            <div className="hd-flesch-score">{result.fleschScore}</div>
            <div className="hd-flesch-label">{result.readabilityLabel}</div>
          </div>
        </div>
      </div>
      </Reveal>
    </div>
  );
}