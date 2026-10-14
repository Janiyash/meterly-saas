import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create a default API key for every new user so usage is
      // always tracked from their very first analysis, even if they
      // never visit the API Keys page.
      if (!user.id) return;
      const token = `mk_default_${user.id.slice(0, 8)}_${Date.now()}`;
      await prisma.apiKey
        .create({
          data: {
            userId: user.id,
            name: "Default key",
            token,
            last4: token.slice(-4),
          },
        })
        .catch(() => null); // never block sign-in
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };