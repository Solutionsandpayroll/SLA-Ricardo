import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json(
      { success: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!solicitud) {
    return NextResponse.json(
      { success: false, error: "La solicitud no existe." },
      { status: 404 }
    );
  }

  if (user.role !== "ADMIN" && solicitud.userId !== user.id) {
    return NextResponse.json(
      { success: false, error: "No puedes eliminar solicitudes de otro usuario." },
      { status: 403 }
    );
  }

  await prisma.solicitud.delete({ where: { id } });

  return NextResponse.json({ success: true });
}