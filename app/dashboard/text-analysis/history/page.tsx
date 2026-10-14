import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import HistoryClient from "./HistoryClient";
import Reveal from "@/components/motion/Reveal";

export default async function AnalysisHistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const rows = await prisma.analysis
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, preview: true, wordCount: true,
        fleschScore: true, readability: true, createdAt: true,
      },
    })
    .catch(() => []);

  return (
    <div>
      <style>{`
        .hist-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .hist-head-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
        .hist-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px;
        }
        .hist-sub { font-size: 14px; color: var(--ink-soft); }
      `}</style>

      <Reveal>
        <div className="hist-head-row">
          <div>
            <div className="hist-kicker">Text analysis</div>
            <h1 className="hist-title">History</h1>
            <p className="hist-sub">Every document you've run through the analyzer, saved automatically.</p>
          </div>
          <Link href="/dashboard/text-analysis" className="btn btn-brass btn-glow">New analysis</Link>
        </div>
      </Reveal>

      <HistoryClient
        initialRows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </div>
  );
}
