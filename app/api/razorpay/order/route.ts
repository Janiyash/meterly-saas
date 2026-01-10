// app/api/razorpay/order/route.ts
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { PLAN_CONFIG } from "@/lib/plan-config";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const price = PLAN_CONFIG[plan].price;

    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `receipt_${plan}_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    );
  }
}
