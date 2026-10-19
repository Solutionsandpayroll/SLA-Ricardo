// app/api/informe-sla/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // <- ajusta si tu cliente de Prisma está en otro archivo

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ solicitudes: [] });
  }

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId: user.id },
    include: { cliente: { select: { nombre: true, pais: true } } },
    orderBy: { fechaRecibido: "asc" },
  });

  return NextResponse.json({ solicitudes });
}