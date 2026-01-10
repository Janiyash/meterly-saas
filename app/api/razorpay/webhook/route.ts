import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const { userId, plan } = event.payload.payment.entity.notes;

    const planRecord = await prisma.plan.findUnique({
      where: { name: plan },
    });

    if (!planRecord) {
      return new Response("Plan not found", { status: 404 });
    }

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
  }

  return new Response("ok");
}
