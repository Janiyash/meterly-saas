import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const body = await req.json();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = body;

  // ✅ VERIFY SIGNATURE
  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated !== razorpay_signature) {
    return new Response("Invalid signature", { status: 400 });
  }

  // ✅ FETCH ORDER TO GET userId + plan
  const order = await razorpay.orders.fetch(razorpay_order_id);

  const userId = order.notes?.userId;
  const plan = order.notes?.plan;

  if (!userId || !plan) {
    return new Response("Invalid order metadata", { status: 400 });
  }

  // ✅ FIND PLAN
  const planRecord = await prisma.plan.findUnique({
    where: { name: plan },
  });

  if (!planRecord) {
    return new Response("Plan not found", { status: 404 });
  }

  // ✅ UPDATE SUBSCRIPTION (THIS NOW WORKS)
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

  return Response.json({ success: true });
}
