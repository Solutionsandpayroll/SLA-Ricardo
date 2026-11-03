// Estadísticas del SLA para la página de reportes.
// Aquí NO hay datos de prueba: conecta getStats() a tu fuente real
// (base de datos, API, etc.). Mientras tanto devuelve todo en cero.

export type SlaStats = {
  total: number;
  pendientes: number; // sin resolver (pendientes + en proceso)
  resueltas: number;
  incumplidas: number; // resueltas fuera del plazo del SLA
  cumplimiento: number | null; // % de resueltas dentro del plazo
};

export async function getStats(): Promise<SlaStats> {
  // TODO: reemplazar por la consulta real, por ejemplo:
  //   const filas = await db.solicitud.findMany();
  // y calcular los cinco valores a partir de esas filas.
  return {
    total: 0,
    pendientes: 0,
    resueltas: 0,
    incumplidas: 0,
    cumplimiento: null,
  };
}