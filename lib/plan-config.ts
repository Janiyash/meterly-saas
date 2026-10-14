export const PLAN_CONFIG = {
  FREE: {
    price: 0,
    requests: 200,
  },
  PRO: {
    price: 999,
    requests: 2000,
  },
  ENTERPRISE: {
    price: 4999,
    requests: Infinity,
  },
} as const;
export type PlanName = keyof typeof PLAN_CONFIG;