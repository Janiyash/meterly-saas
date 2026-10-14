import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpay } from "@/lib/razorpay";
import { PLAN_CONFIG, PlanName } from "@/lib/plan-config";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan?: string };

  if (!plan || !(plan in PLAN_CONFIG) || plan === "FREE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const config = PLAN_CONFIG[plan as PlanName];

  try {
    const order = await razorpay.orders.create({
      amount: config.price * 100, // paise
      currency: "INR",
      receipt: `meterly_${session.user.id}_${Date.now()}`,
      notes: { userId: session.user.id, plan },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
