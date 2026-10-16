import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { ensureDefaultKey } from "@/lib/default-key";


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
    // Every new user gets one free default API key.
    async createUser({ user }) {
      if (user.id) await ensureDefaultKey(user.id);
    },
    // Also covers older accounts that never got a key (runs on every sign-in,
    // but only creates a key if the user has never had one).
    async signIn({ user }) {
      if (user.id) await ensureDefaultKey(user.id);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };