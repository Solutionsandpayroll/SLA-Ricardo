import { prisma } from "@/lib/prisma";

export type SlaStats = {
  total: number;
  pendientes: number; // sin respuesta
  resueltas: number; // con fecha de respuesta
  incumplidas: number; // respondidas fuera del plazo del SLA
  cumplimiento: number | null; // % de resueltas dentro del plazo
  tiempoPromedioMs: number | null; // promedio de respuesta (calendario)
};

export async function getStats(): Promise<SlaStats> {
  const [total, resueltas, incumplidasRows, promedioRows] = await Promise.all([
    prisma.solicitud.count(),
    prisma.solicitud.count({ where: { fechaRespuesta: { not: null } } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Solicitud"
      WHERE "fechaRespuesta" IS NOT NULL
        AND "vencimientoSLA" IS NOT NULL
        AND "fechaRespuesta" > "vencimientoSLA"
    `,
    prisma.$queryRaw<{ ms: number | null }[]>`
      SELECT AVG(
        EXTRACT(EPOCH FROM (
          "fechaRespuesta" - COALESCE("inicioConteoSLA", "fechaRecibido")
        )) * 1000
      )::float8 AS ms
      FROM "Solicitud"
      WHERE "fechaRespuesta" IS NOT NULL
    `,
  ]);

  const incumplidas = Number(incumplidasRows[0]?.count ?? 0);
  const pendientes = total - resueltas;
  const cumplimiento =
    resueltas > 0
      ? Math.round(((resueltas - incumplidas) / resueltas) * 100)
      : null;
  const tiempoPromedioMs = promedioRows[0]?.ms ?? null;

  return {
    total,
    pendientes,
    resueltas,
    incumplidas,
    cumplimiento,
    tiempoPromedioMs,
  };
}