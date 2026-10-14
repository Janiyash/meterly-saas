import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import ResumeClient from "./ResumeClient";

export default async function ResumePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const history = await prisma.resumeAnalysis
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, fileName: true, atsScore: true, createdAt: true, summary: true },
    })
    .catch(() => []);

  return (
    <ResumeClient
      history={history.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  );
}