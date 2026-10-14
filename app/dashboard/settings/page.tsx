import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import Reveal from "@/components/motion/Reveal";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string;

  const [user, accounts] = await Promise.all([
    prisma.user
      .findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true, createdAt: true },
      })
      .catch(() => null),
    prisma.account
      .findMany({ where: { userId }, select: { provider: true } })
      .catch(() => []),
  ]);

  const connectedSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <style>{`
        .set-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 12px; }
        .set-title {
          font-family: var(--font-display); font-style: italic; font-weight: 500;
          font-size: clamp(26px, 3.2vw, 34px); color: var(--ink); margin-bottom: 8px;
        }
        .set-sub { font-size: 14px; color: var(--ink-soft); margin-bottom: 8px; }
      `}</style>

      <Reveal>
        <div className="set-kicker">Account</div>
        <h1 className="set-title">Settings</h1>
        <p className="set-sub">Manage your profile and account.</p>
      </Reveal>

      <SettingsClient
        initialName={user?.name ?? session?.user?.name ?? ""}
        email={user?.email ?? session?.user?.email ?? ""}
        initialImage={user?.image ?? session?.user?.image ?? null}
        connectedSince={connectedSince}
        providers={accounts.map((a) => a.provider)}
      />
    </div>
  );
}