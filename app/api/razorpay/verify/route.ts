import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    userId,
  } = body;

  /* =========================
     VALIDATION (IMPORTANT)
  ========================= */
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !userId ||
    !plan
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // ✅ FORCE plan to string (FIX)
  const planName = String(plan);

  /* =========================
     VERIFY SIGNATURE
  ========================= */
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  /* =========================
     FIND PLAN (FIXED)
  ========================= */
  const planRecord = await prisma.plan.findUnique({
    where: { name: planName }, // ✅ always string now
  });

  if (!planRecord) {
    return NextResponse.json(
      { error: "Plan not found" },
      { status: 404 }
    );
  }

  /* =========================
     UPSERT SUBSCRIPTION
  ========================= */
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: planRecord.id,
      status: "ACTIVE",
    },
    create: {
      userId,
      planId: planRecord.id,
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ success: true });
}
