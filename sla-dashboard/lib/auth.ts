import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,

      allowDangerousEmailAccountLinking: true,

      authorization: {
        params: {
          scope: "openid profile email User.Read Mail.Read offline_access",
        },
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: user.id,
        } as typeof session.user & { id: string };
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "database",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: false,
};