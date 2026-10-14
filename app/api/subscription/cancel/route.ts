import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = (await req.json().catch(() => ({}))) as {
    action?: "cancel" | "resume";
  };

  if (action !== "cancel" && action !== "resume") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  if (subscription.plan.name === "FREE") {
    return NextResponse.json(
      { error: "The Free plan can't be cancelled." },
      { status: 400 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: { cancelAtPeriodEnd: action === "cancel" },
  });

  return NextResponse.json({ ok: true, cancelAtPeriodEnd: updated.cancelAtPeriodEnd });
}