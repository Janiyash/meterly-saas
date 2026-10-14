import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG } from "@/lib/plan-config";
import Reveal from "@/components/motion/Reveal";
import PricingGrid from "@/components/pricing/PricingGrid";

const PLAN_COPY: Record<string, { tagline: string; features: string[] }> = {
  FREE: {
    tagline: "Try Meterly with no commitment.",
    features: ["200 requests / month", "1 API key", "Text analysis workspace", "Community support"],
  },
  PRO: {
    tagline: "For products with real, growing traffic.",
    features: ["2,000 requests / month", "Unlimited API keys", "Full usage analytics", "Analysis history", "Email support"],
  },
  ENTERPRISE: {
    tagline: "For teams metering production-scale usage.",
    features: ["Unlimited requests", "Unlimited API keys", "Priority support", "Custom billing terms"],
  },
};

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  let currentPlan: string | null = null;
  if (session?.user?.id) {
    const sub = await prisma.subscription
      .findUnique({ where: { userId: session.user.id as string }, include: { plan: true } })
      .catch(() => null);
    currentPlan = sub?.plan?.name ?? "FREE";
  }

  const plans = (Object.keys(PLAN_CONFIG) as (keyof typeof PLAN_CONFIG)[]).map((name) => ({
    name,
    ...PLAN_CONFIG[name],
    ...PLAN_COPY[name],
  }));

  return (
    <div className="pr-page">
      <style>{`
        .pr-page { min-height: 100vh; background: var(--paper); }
        .pr-main { max-width: 1080px; margin: 0 auto; padding: 96px 28px 80px; }
        .pr-intro { max-width: 560px; margin-bottom: 52px; }
        .pr-kicker { font-size: 13px; font-weight: 600; color: var(--brass-deep); margin-bottom: 16px; }
        .pr-title {
          font-family: var(--font-display); font-weight: 500;
          font-size: clamp(30px, 4.4vw, 44px); line-height: 1.08;
          color: var(--ink); margin-bottom: 18px;
        }
        .pr-lede { font-size: 15px; line-height: 1.65; color: var(--ink-soft); }
        .pr-footnote { font-size: 12px; color: var(--ink-faint); margin-top: 24px; }
      `}</style>

      <main className="pr-main">
        <Reveal>
          <div className="pr-intro">
            <p className="pr-kicker">Pricing</p>
            <h1 className="pr-title">Pay for what you measure.</h1>
            <p className="pr-lede">
              Every plan includes the same metering engine. The only difference is how much
              traffic it's rated for.
            </p>
          </div>
        </Reveal>

        <PricingGrid plans={plans} currentPlan={currentPlan} hasSession={!!session} />

        <p className="pr-footnote">
          Prices in INR, billed monthly via Razorpay. Cancel or change plans any time.
        </p>
      </main>
    </div>
  );
}