"use client";

import { useState } from "react";

export interface AnalysisResult {
  wordCount: number;
  charCount: number;
  charNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readingTime: string;
  uniqueWords: number;
  longestWord: string;
  mostCommonWord: string;
  fleschScore: number;
  readabilityLabel: string;
  topWords: { word: string; count: number }[];
}

export function useAnalysis() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  async function runAnalysis() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(`Quota exceeded — ${data.used}/${data.limit} requests used this month on the ${data.plan} plan.`);
        } else {
          setError(data.error ?? "Analysis failed");
        }
        return;
      }

      setResult(data.result);
      setTracked(data.tracked);
      setRequestCount((c) => c + 1);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setText("");
    setResult(null);
    setError(null);
  }

  function backToEdit() {
    // keep the text, drop the result, so the person can tweak and re-run
    setResult(null);
    setError(null);
  }

  const wordCount = text.trim() ? (text.trim().match(/\b\w+\b/g) || []).length : 0;
  const charCount = text.length;

  return {
    text, setText, result, loading, error, tracked, requestCount,
    runAnalysis, clearAll, backToEdit, wordCount, charCount,
  };
}