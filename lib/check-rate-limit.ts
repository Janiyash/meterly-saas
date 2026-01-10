import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "./plan-limits";

/**
 * Per-minute rate limits per plan
 * (separate from monthly PLAN_LIMITS logic)
 */
const RATE_LIMITS: Record<keyof typeof PLAN_LIMITS, number> = {
  FREE: 10,
  PRO: 60,
  ENTERPRISE: Infinity,
};

export async function checkRateLimit(
  apiKeyId: string,
  planName: keyof typeof PLAN_LIMITS
) {
  const limit = RATE_LIMITS[planName];

  // ✅ Enterprise: no rate limit
  if (limit === Infinity) {
    return null;
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // ✅ FIX: use `date` (exists in Usage model)
  const count = await prisma.usage.count({
    where: {
      apiKeyId,
      date: {
        gte: oneMinuteAgo,
      },
    },
  });

  if (count >= limit) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit,
        window: "1 minute",
      }),
      { status: 429 }
    );
  }

  return null; // ✅ allowed
}
