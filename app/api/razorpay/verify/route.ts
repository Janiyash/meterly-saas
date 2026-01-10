// app/api/razorpay/verify/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PLAN_CONFIG } from "@/lib/plan-config";    

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !PLAN_CONFIG[plan]
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    /* ✅ VERIFY SIGNATURE */
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    /* 🔥 GET PLAN ID FROM DB (CRITICAL FIX) */
    const planRecord = await prisma.plan.findUnique({
      where: { name: plan },
    });

    if (!planRecord) {
      return NextResponse.json(
        { error: "Plan not found in DB" },
        { status: 400 }
      );
    }

    /* ✅ UPSERT SUBSCRIPTION WITH planId */
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        planId: planRecord.id,
        status: "ACTIVE",
      },
      create: {
        userId: session.user.id,
        planId: planRecord.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
