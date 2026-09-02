import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      // GITHUB_CLIENT_ID/SECRET preferred; AUTH_GITHUB_ID/SECRET are the
      // Auth.js v5 conventional fallbacks.
      clientId: process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: "database" },
});
