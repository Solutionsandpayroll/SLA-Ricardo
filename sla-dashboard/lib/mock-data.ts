// Datos de prueba. Cuando tengas la base de datos real, reemplaza esto
// por las consultas y deja las mismas funciones (getStats, resumenPor...).

export type Estado = "Pendiente" | "En proceso" | "Resuelta";
export type Prioridad = "Alta" | "Media" | "Baja";

export type Solicitud = {
  id: string;
  asunto: string;
  cliente: string;
  responsable: string;
  prioridad: Prioridad;
  estado: Estado;
  creada: string; // YYYY-MM-DD
  respuestaHoras: number | null; // horas hasta la primera respuesta
  resolucionHoras: number | null; // horas hasta el cierre
  slaHoras: number; // plazo máximo acordado
};

export const solicitudes: Solicitud[] = [
  { id: "SOL-1001", asunto: "Error en liquidación de nómina", cliente: "Grupo Andino", responsable: "Laura Gómez", prioridad: "Alta", estado: "Resuelta", creada: "2026-10-20", respuestaHoras: 1.5, resolucionHoras: 6, slaHoras: 8 },
  { id: "SOL-1002", asunto: "Certificado laboral", cliente: "Textiles del Valle", responsable: "Carlos Ruiz", prioridad: "Baja", estado: "Resuelta", creada: "2026-10-21", respuestaHoras: 3, resolucionHoras: 20, slaHoras: 48 },
  { id: "SOL-1003", asunto: "Ajuste de novedades quincena", cliente: "Comercial Norte", responsable: "Andrea Pérez", prioridad: "Media", estado: "Resuelta", creada: "2026-10-21", respuestaHoras: 2, resolucionHoras: 30, slaHoras: 24 },
  { id: "SOL-1004", asunto: "Reporte de seguridad social", cliente: "Logística Express", responsable: "Laura Gómez", prioridad: "Alta", estado: "En proceso", creada: "2026-10-26", respuestaHoras: 1, resolucionHoras: null, slaHoras: 8 },
  { id: "SOL-1005", asunto: "Pago de prima de servicios", cliente: "Farmacia Central", responsable: "Carlos Ruiz", prioridad: "Alta", estado: "Pendiente", creada: "2026-10-27", respuestaHoras: null, resolucionHoras: null, slaHoras: 8 },
  { id: "SOL-1006", asunto: "Cambio de datos bancarios", cliente: "Grupo Andino", responsable: "Andrea Pérez", prioridad: "Media", estado: "Resuelta", creada: "2026-10-22", respuestaHoras: 4, resolucionHoras: 18, slaHoras: 24 },
  { id: "SOL-1007", asunto: "Liquidación de contrato", cliente: "Textiles del Valle", responsable: "Laura Gómez", prioridad: "Media", estado: "Resuelta", creada: "2026-10-22", respuestaHoras: 2.5, resolucionHoras: 36, slaHoras: 24 },
  { id: "SOL-1008", asunto: "Consulta de vacaciones", cliente: "Comercial Norte", responsable: "Carlos Ruiz", prioridad: "Baja", estado: "Resuelta", creada: "2026-10-23", respuestaHoras: 5, resolucionHoras: 26, slaHoras: 48 },
  { id: "SOL-1009", asunto: "Planilla PILA mensual", cliente: "Logística Express", responsable: "Andrea Pérez", prioridad: "Alta", estado: "Pendiente", creada: "2026-10-28", respuestaHoras: null, resolucionHoras: null, slaHoras: 8 },
  { id: "SOL-1010", asunto: "Incapacidad pendiente de reconocer", cliente: "Farmacia Central", responsable: "Laura Gómez", prioridad: "Media", estado: "En proceso", creada: "2026-10-27", respuestaHoras: 3, resolucionHoras: null, slaHoras: 24 },
  { id: "SOL-1011", asunto: "Desprendibles de pago", cliente: "Grupo Andino", responsable: "Carlos Ruiz", prioridad: "Baja", estado: "Resuelta", creada: "2026-10-24", respuestaHoras: 1, resolucionHoras: 5, slaHoras: 48 },
  { id: "SOL-1012", asunto: "Retención en la fuente", cliente: "Comercial Norte", responsable: "Andrea Pérez", prioridad: "Alta", estado: "Resuelta", creada: "2026-10-24", respuestaHoras: 2, resolucionHoras: 12, slaHoras: 8 },
];

/* ---------- Utilidades de formato ---------- */

export function formatHoras(h: number | null): string {
  return h === null ? "—" : `${h.toFixed(1).replace(".", ",")} h`;
}

export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export type Tono = "ok" | "warn" | "bad" | "info" | "muted";

export function tonoEstado(e: Estado): Tono {
  return e === "Resuelta" ? "ok" : e === "En proceso" ? "info" : "warn";
}

export function tonoPrioridad(p: Prioridad): Tono {
  return p === "Alta" ? "bad" : p === "Media" ? "warn" : "muted";
}

/* ---------- Cálculos de SLA ---------- */

// true = cumplió, false = incumplió, null = aún no se evalúa (sin cerrar)
export function cumpleSla(s: Solicitud): boolean | null {
  if (s.resolucionHoras === null) return null;
  return s.resolucionHoras <= s.slaHoras;
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function getStats() {
  const resueltas = solicitudes.filter((s) => s.estado === "Resuelta");
  const dentro = resueltas.filter((s) => cumpleSla(s) === true).length;

  return {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s) => s.estado !== "Resuelta").length,
    resueltas: resueltas.length,
    promedioRespuesta: promedio(
      solicitudes.map((s) => s.respuestaHoras).filter((h): h is number => h !== null)
    ),
    promedioResolucion: promedio(
      solicitudes.map((s) => s.resolucionHoras).filter((h): h is number => h !== null)
    ),
    cumplimiento:
      resueltas.length > 0 ? Math.round((dentro / resueltas.length) * 100) : null,
    incumplidas: resueltas.length - dentro,
  };
}

// Resumen agrupado por cliente o por responsable
export function resumenPor(campo: "cliente" | "responsable") {
  const grupos = new Map<string, Solicitud[]>();
  for (const s of solicitudes) {
    grupos.set(s[campo], [...(grupos.get(s[campo]) ?? []), s]);
  }

  return [...grupos.entries()].map(([nombre, items]) => {
    const resueltas = items.filter((s) => s.estado === "Resuelta");
    const dentro = resueltas.filter((s) => cumpleSla(s) === true).length;
    return {
      nombre,
      total: items.length,
      pendientes: items.filter((s) => s.estado !== "Resuelta").length,
      resueltas: resueltas.length,
      cumplimiento:
        resueltas.length > 0 ? Math.round((dentro / resueltas.length) * 100) : null,
    };
  });
}