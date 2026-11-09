import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function validarAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (usuario?.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, error: "Sin permisos" },
        { status: 403 }
      ),
    };
  }

  return { error: null };
}

// ======================================================
// CREAR CLIENTE
// ======================================================

export async function POST(request: Request) {
  try {
    const { error } = await validarAdmin();
    if (error) return error;

    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const dominio = String(body.dominio ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");
    const pais = String(body.pais ?? "").trim();

    if (!nombre || !dominio) {
      return NextResponse.json(
        { success: false, error: "El nombre y el dominio son obligatorios." },
        { status: 400 }
      );
    }

    const existe = await prisma.cliente.findFirst({ where: { dominio } });

    if (existe) {
      return NextResponse.json(
        { success: false, error: "Ya existe un cliente con ese dominio." },
        { status: 409 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, dominio, pais: pais || null },
    });

    return NextResponse.json({ success: true, cliente });
  } catch (error) {
    console.error("Error creando cliente:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el cliente." },
      { status: 500 }
    );
  }
}

// ======================================================
// ELIMINAR CLIENTE
// ======================================================

export async function DELETE(request: Request) {
  try {
    const { error } = await validarAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const nombre = (
      searchParams.get("nombre") ?? searchParams.get("id")
    )?.trim();

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: "Falta el nombre del cliente." },
        { status: 400 }
      );
    }

    const clave = nombre.toLocaleLowerCase("es");

    // Nombres tal como están guardados (misma regla de agrupación)
    const filas = await prisma.solicitud.findMany({
      where: { nombreCliente: { not: "" } },
      select: { nombreCliente: true },
      distinct: ["nombreCliente"],
    });

    const nombresExactos = filas
      .map((f) => f.nombreCliente)
      .filter(
        (n): n is string => !!n && n.trim().toLocaleLowerCase("es") === clave
      );

    if (nombresExactos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado." },
        { status: 404 }
      );
    }

    const [solicitudes, clientes] = await prisma.$transaction([
      prisma.solicitud.deleteMany({
        where: { nombreCliente: { in: nombresExactos } },
      }),
      prisma.cliente.deleteMany({
        where: { nombre: { in: nombresExactos } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      solicitudesEliminadas: solicitudes.count,
      clientesEliminados: clientes.count,
    });
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el cliente." },
      { status: 500 }
    );
  }
}