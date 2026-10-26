
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Acceso de empleados mediante Microsoft.
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read Mail.Read offline_access",
        },
      },
    }),

    // Acceso exclusivo de administradores mediante credenciales propias.
    CredentialsProvider({
      id: "admin-credentials",
      name: "Acceso de administrador",
      credentials: {
        email: {
          label: "Correo electrónico",
          type: "email",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password || password.length > 1024) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });

        // No crear administradores automáticamente.
        if (
          !user ||
          user.role !== "ADMIN" ||
          !user.passwordHash
        ) {
          return null;
        }

        const passwordValida = await compare(
          password,
          user.passwordHash
        );

        if (!passwordValida) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // Impide que una cuenta ADMIN utilice el acceso de empleados.
    async signIn({ user, account }) {
      if (account?.provider === "azure-ad") {
        if (!user.id) return false;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        return dbUser?.role !== "ADMIN";
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });

        token.role = dbUser?.role ?? "USER";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        const sessionUser = session.user as typeof session.user & {
          id: string;
          role: Role;
        };

        sessionUser.id = token.id as string;
        sessionUser.role = (token.role as Role) ?? "USER";
      }

      return session;
    },
  },

  // No asignamos roles automáticamente durante el inicio de sesión.
  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};
