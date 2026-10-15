import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AnalisisCharts } from "./analisis-charts"

export const dynamic = "force-dynamic"

const ZONA = "America/Bogota"

function claveDia(fecha: Date) {
  // Devuelve YYYY-MM-DD en hora de Colombia
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA })
}

function contar(items: (string | null | undefined)[], limite = 8) {
  const mapa = new Map<string, number>()

  for (const item of items) {
    const clave = item?.trim() || "Sin clasificar"
    mapa.set(clave, (mapa.get(clave) || 0) + 1)
  }

  return [...mapa.entries()]
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite)
}

export default async function AnalisisPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <p className="text-slate-600">Debes iniciar sesión para ver el análisis.</p>
  }

  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId: session.user.id, fechaRecibido: { gte: desde } },
    select: {
      fechaRecibido: true,
      fechaRespuesta: true,
      nombreCliente: true,
      tipoProceso: true,
    },
  })

  // Solicitudes por día (incluye los días en cero)
  const porDiaMapa = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    porDiaMapa.set(claveDia(new Date(Date.now() - i * 86400000)), 0)
  }
  for (const s of solicitudes) {
    const clave = claveDia(s.fechaRecibido)
    if (porDiaMapa.has(clave)) porDiaMapa.set(clave, porDiaMapa.get(clave)! + 1)
  }
  const porDia = [...porDiaMapa.entries()].map(([nombre, valor]) => ({
    nombre: nombre.slice(5), // MM-DD
    valor,
  }))

  // Tiempo de respuesta (horas) de las solicitudes respondidas, promedio por día
  const horasPorDia = new Map<string, number[]>()
  const todasLasHoras: number[] = []

  for (const s of solicitudes) {
    if (!s.fechaRespuesta) continue
    const horas =
      (s.fechaRespuesta.getTime() - s.fechaRecibido.getTime()) / 3600000
    if (horas < 0) continue

    todasLasHoras.push(horas)
    const clave = claveDia(s.fechaRecibido).slice(5)
    horasPorDia.set(clave, [...(horasPorDia.get(clave) || []), horas])
  }

  const promedio = (n: number[]) => n.reduce((a, b) => a + b, 0) / n.length

  const tiempoPorDia = [...horasPorDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, horas]) => ({
      nombre,
      valor: Number(promedio(horas).toFixed(1)),
    }))

  return (
    <AnalisisCharts
      total={solicitudes.length}
      porDia={porDia}
      porCliente={contar(solicitudes.map((s) => s.nombreCliente))}
      porTipo={contar(solicitudes.map((s) => s.tipoProceso))}
      tiempoPorDia={tiempoPorDia}
      promedioHoras={
        todasLasHoras.length ? Number(promedio(todasLasHoras).toFixed(1)) : null
      }
    />
  )
}