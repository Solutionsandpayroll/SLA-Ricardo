import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function limpiarDominio(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .split("/")[0]
}

async function autorizado() {
  const session = await getServerSession(authOptions)
  return Boolean(session?.user?.id)
}

export async function GET() {
  if (!(await autorizado())) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { solicitudes: true } } },
  })

  return NextResponse.json({ success: true, clientes })
}

export async function POST(request: Request) {
  if (!(await autorizado())) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const nombre = String(body.nombre || "").trim()
    const dominio = limpiarDominio(String(body.dominio || ""))
    const pais = String(body.pais || "").trim() || null

    if (!nombre) {
      return NextResponse.json({ success: false, error: "El nombre es obligatorio." }, { status: 400 })
    }

    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dominio)) {
      return NextResponse.json(
        { success: false, error: "El dominio no es válido (ejemplo: empresa.com)." },
        { status: 400 }
      )
    }

    const cliente = await prisma.cliente.create({ data: { nombre, dominio, pais } })

    return NextResponse.json({ success: true, cliente })
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Ya existe un cliente con ese dominio." },
        { status: 409 }
      )
    }

    console.error("Error creando cliente:", error)
    return NextResponse.json({ success: false, error: "No se pudo crear el cliente." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await autorizado())) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, error: "Falta el id." }, { status: 400 })
  }

  try {
    await prisma.cliente.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return NextResponse.json({ success: false, error: "No se pudo eliminar el cliente." }, { status: 500 })
  }
}