import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "96px 28px 64px" }}>
        {children}
      </main>
    </div>
  );
}