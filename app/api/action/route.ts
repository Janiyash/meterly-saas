import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { incrementUsage } from "@/lib/usage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apiKeyId } = await req.json();

  if (!apiKeyId) {
    return NextResponse.json(
      { error: "API key missing" },
      { status: 400 }
    );
  }

  // ✅ FIXED: pass OBJECT, not string
  await incrementUsage({
    userId: session.user.id,
    apiKeyId,
  });

  return NextResponse.json({ success: true });
}
