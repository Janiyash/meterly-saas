import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { generateRawApiKey, encrypt } from "@/lib/api-key";


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
      const rawKey = generateRawApiKey();
          
      await prisma.apiKey
        .create({
          data: {
            userId: user.id,
            name: "Default key",
            encryptedKey: encrypt(rawKey),
            last4: rawKey.slice(-4),
          },
        })
        .catch(() => null);// never block sign-in
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };