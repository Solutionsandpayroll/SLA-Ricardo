
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "./auth";

export async function requireAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const user = session.user as typeof session.user & {
    role: Role;
  };

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

export const requireAdmin = requireAdminPage;
