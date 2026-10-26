"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";

export async function cambiarRol(userId: string, rol: "USER" | "ADMIN") {
  // Solo un administrador puede ejecutar esta acción
  await requireAdminPage();

  if (rol !== "USER" && rol !== "ADMIN") {
    return { ok: false, error: "Rol no válido." };
  }

  // Evita quedarte sin administradores
  if (rol === "USER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    const objetivo = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (objetivo?.role === "ADMIN" && admins <= 1) {
      return { ok: false, error: "Debe existir al menos un administrador." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role: rol } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}