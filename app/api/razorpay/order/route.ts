import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpay } from "@/lib/razorpay";
import { PLAN_CONFIG } from "@/lib/plan-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const order = await razorpay.orders.create({
    amount: planConfig.price * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: session.user.id, // ✅ SOURCE OF TRUTH
      plan,
    },
  });

  return NextResponse.json(order);
}
