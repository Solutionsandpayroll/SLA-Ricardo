import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

// Obtiene el correo normalizado desde el usuario o el perfil de Microsoft.
// Algunas cuentas de Microsoft traen el correo vacío y solo "preferred_username".
function obtenerCorreo(
  user?: { email?: string | null } | null,
  profile?: unknown
): string | null {
  const p = profile as
    | { email?: string; preferred_username?: string }
    | undefined;

  const correo = user?.email ?? p?.email ?? p?.preferred_username;

  return correo ? correo.trim().toLowerCase() : null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ==========================================
    // EMPLEADOS: MICROSOFT
    // ==========================================
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // IMPORTANTE: debe ser el ID real de tu tenant (no "common" ni "organizations"),
      // porque es lo que limita el acceso a cuentas de tu empresa.
      tenantId: process.env.AZURE_AD_TENANT_ID!,

      authorization: {
        params: {
          scope: "openid profile email User.Read Mail.Read offline_access",
          prompt: "login",
        },
      },
    }),

    // ==========================================
    // ADMINISTRADORES: CORREO Y CONTRASEÑA
    // ==========================================
    CredentialsProvider({
      id: "admin-credentials",
      name: "Acceso de administrador",

      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password || password.length > 1024) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });

        if (!user || user.role !== "ADMIN" || !user.passwordHash) {
          return null;
        }

        const passwordValida = await compare(password, user.passwordHash);

        if (!passwordValida) return null;

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
    // ==========================================
    // VALIDAR QUIÉN PUEDE ENTRAR
    // ==========================================
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        const email = obtenerCorreo(user, profile);

        if (!email) return false;

        const dbUser = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
          select: { id: true },
        });

        // Si es la primera vez que entra, se crea como empleado (USER).
        // Solo llegan aquí cuentas del tenant configurado en AZURE_AD_TENANT_ID.
        if (!dbUser) {
          await prisma.user.create({
            data: {
              email,
              name: user.name ?? email,
              image: user.image,
              role: "USER",
            },
          });
        }

        // Pueden entrar empleados y también administradores.
        return true;
      }

      if (account?.provider === "admin-credentials") {
        return true;
      }

      return false;
    },

    // ==========================================
    // JWT
    // ==========================================
    async jwt({ token, user, account, profile }) {
      // Primer inicio de sesión.
      if (user) {
        let dbUser;

        if (account?.provider === "admin-credentials") {
          dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, email: true, role: true },
          });
        } else {
          const email = obtenerCorreo(user, profile);

          if (!email) return token;

          dbUser = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: "insensitive" },
            },
            select: { id: true, email: true, role: true },
          });
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
        }
      } else if (token.id) {
        // Comprobar que el usuario siga existiendo.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, email: true, role: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
        } else {
          token.id = undefined;
          token.role = undefined;
        }
      }

      return token;
    },

    // ==========================================
    // SESSION
    // ==========================================
    async session({ session, token }) {
      if (session.user && token.id) {
        const sessionUser = session.user as typeof session.user & {
          id: string;
          role: Role;
        };

        sessionUser.id = token.id as string;
        sessionUser.role = token.role as Role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};