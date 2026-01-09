import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpay } from "@/lib/razorpay";

// 🔴 THIS IS THE FIX
export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const order = await razorpay.orders.create({
      amount: 999 * 100, // ₹999
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan: "PRO",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order error:", error);

    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
