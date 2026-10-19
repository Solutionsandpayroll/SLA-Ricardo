// lib/mapearSolicitud.ts
// Convierte una fila de Prisma (llega como JSON, con fechas en texto) al formato del informe.
import type { EstadoSLA, SolicitudSLA } from "./exportarInformeSLA";

export interface SolicitudApi {
  id: string;
  asunto: string;
  cuerpo: string;
  remitente: string;
  encargado: string | null;
  fechaRecibido: string;
  inicioConteoSLA: string | null;
  vencimientoSLA: string | null;
  fechaRespuesta: string | null;
  tiempoHabil: string | null;
  estadoSLA: string | null;
  estado: string;
  nombreCliente: string | null;
  tipoProceso: string | null;
  paisCliente: string | null;
  evidenciaRespuesta: string | null;
  observaciones: string | null;
  clasificacionIA: string | null;
  cliente: { nombre: string; pais: string | null } | null;
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .trim();

const MAPA_ESTADOS: Record<string, EstadoSLA> = {
  nueva: "Nueva",
  asignada: "Asignada",
  "pendiente de respuesta": "Pendiente de respuesta",
  pendiente: "Pendiente de respuesta",
  "proxima a vencer": "Próxima a vencer",
  "sla vencido": "SLA vencido",
  vencido: "SLA vencido",
  "en gestion": "En gestión",
  respondida: "Respondida",
  respondido: "Respondida",
  cerrada: "Cerrada",
  cerrado: "Cerrada",
  "requiere validacion": "Requiere validación",
  "no verificable": "No verificable",
};

function convertirEstado(estado: string, estadoSLA: string | null): EstadoSLA {
  // Si el SLA está vencido o por vencer, eso manda sobre el estado de gestión
  const sla = estadoSLA ? MAPA_ESTADOS[normalizar(estadoSLA)] : undefined;
  if (sla === "SLA vencido" || sla === "Próxima a vencer") return sla;
  return MAPA_ESTADOS[normalizar(estado)] ?? sla ?? "Requiere validación";
}

const resumirTexto = (t: string, max = 300) => {
  const limpio = t.replace(/\s+/g, " ").trim();
  return limpio.length > max ? limpio.slice(0, max - 1) + "…" : limpio;
};

export function mapearSolicitud(s: SolicitudApi): SolicitudSLA {
  const recibido = new Date(s.fechaRecibido);
  return {
    cliente: s.nombreCliente ?? s.cliente?.nombre ?? "",
    remitente: s.remitente,
    pais: s.paisCliente ?? s.cliente?.pais ?? "",
    servicio: s.clasificacionIA ?? "",
    proceso: s.tipoProceso ?? "",
    asunto: s.asunto,
    resumen: resumirTexto(s.cuerpo),
    fechaRecepcion: recibido,
    inicioConteoSLA: s.inicioConteoSLA ? new Date(s.inicioConteoSLA) : recibido,
    responsable: s.encargado ?? "",
    estado: convertirEstado(s.estado, s.estadoSLA),
    vencimientoSLA: s.vencimientoSLA ? new Date(s.vencimientoSLA) : recibido,
    tiempoHabil: s.tiempoHabil ?? "",
    evidenciaRespuesta: s.evidenciaRespuesta ?? "",
    observaciones: s.observaciones ?? "",
    accionPrioritaria: "",
    fuenteOutlook: "",
  };
}