import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    image?: string | null;
  };

  const trimmed = (body.name ?? "").trim();
  if (!trimmed || trimmed.length > 80) {
    return NextResponse.json({ error: "Name must be 1–80 characters" }, { status: 400 });
  }

  // image is optional: undefined means "leave unchanged" (field omitted),
  // null or "" means "clear it and fall back to the initial avatar".
  const data: { name: string; image?: string | null } = { name: trimmed };
  if ("image" in body) {
    const img = (body.image ?? "").toString().trim();
    data.image = img.length > 0 ? img : null;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true, name: trimmed, image: data.image });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cascades to accounts, sessions, api keys, usage, subscription, analyses, payments.
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}