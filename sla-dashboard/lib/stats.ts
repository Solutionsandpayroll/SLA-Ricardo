import { prisma } from "@/lib/prisma";

// Estadísticas del SLA para la página de reportes.

export type SlaStats = {
  total: number;
  pendientes: number; // sin respuesta
  resueltas: number; // con fecha de respuesta
  incumplidas: number; // respondidas fuera del plazo del SLA
  cumplimiento: number | null; // % de resueltas dentro del plazo
};

export async function getStats(): Promise<SlaStats> {
  const [total, resueltas, incumplidasRows] = await Promise.all([
    prisma.solicitud.count(),
    prisma.solicitud.count({ where: { fechaRespuesta: { not: null } } }),
    // Prisma no permite comparar dos columnas en un where,
    // por eso se usa SQL directo.
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Solicitud"
      WHERE "fechaRespuesta" IS NOT NULL
        AND "vencimientoSLA" IS NOT NULL
        AND "fechaRespuesta" > "vencimientoSLA"
    `,
  ]);

  const incumplidas = Number(incumplidasRows[0]?.count ?? 0);
  const pendientes = total - resueltas;
  const cumplimiento =
    resueltas > 0
      ? Math.round(((resueltas - incumplidas) / resueltas) * 100)
      : null;

  return { total, pendientes, resueltas, incumplidas, cumplimiento };
}