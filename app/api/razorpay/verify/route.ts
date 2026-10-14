import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PLAN_CONFIG, PlanName } from "@/lib/plan-config";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan?: string;
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  if (!(plan in PLAN_CONFIG) || plan === "FREE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Verify the payment signature Razorpay sent back actually came from Razorpay.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const planRecord = await prisma.plan.findUnique({ where: { name: plan as PlanName } });
  if (!planRecord) {
    return NextResponse.json({ error: "Plan not found — has the database been seeded?" }, { status: 500 });
  }

  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    update: { planId: planRecord.id, status: "ACTIVE" },
    create: { userId: session.user.id, planId: planRecord.id, status: "ACTIVE" },
  });

  await prisma.payment
    .create({
      data: {
        userId: session.user.id,
        plan,
        amount: PLAN_CONFIG[plan as PlanName].price * 100,
        currency: "INR",
        status: "SUCCESS",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    })
    .catch((err) => console.error("Failed to record payment history:", err));

  return NextResponse.json({ ok: true, plan });
}
