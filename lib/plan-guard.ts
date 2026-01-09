export function hasPlan(
  userPlan: string,
  requiredPlan: string
) {
  const order = ["FREE", "PRO", "ENTERPRISE"];
  return order.indexOf(userPlan) >= order.indexOf(requiredPlan);
}
