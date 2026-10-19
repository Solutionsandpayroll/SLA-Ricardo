// src/lib/exportarInformeSLA.ts
// Genera el Excel "Seguimiento SLA" con el mismo formato del informe original:
// 4 hojas -> Seguimiento SLA, Resumen ejecutivo, Criterios SLA, Registro de corrección.
// Dependencia: npm i exceljs

import ExcelJS from "exceljs";

/* ───────────── Tipos (ajústalos a tus datos reales) ───────────── */

export type EstadoSLA =
  | "Nueva"
  | "Asignada"
  | "Pendiente de respuesta"
  | "Próxima a vencer"
  | "SLA vencido"
  | "En gestión"
  | "Respondida"
  | "Cerrada"
  | "Requiere validación"
  | "No verificable";

export interface SolicitudSLA {
  cliente: string;
  remitente: string; // "Nombre <correo@dominio.com>"
  pais: string;
  servicio: string;
  proceso: string;
  asunto: string;
  resumen: string;
  fechaRecepcion: Date;
  inicioConteoSLA: Date;
  responsable: string;
  estado: EstadoSLA;
  vencimientoSLA: Date;
  tiempoHabil: string; // ej. "4 h 31 min"
  evidenciaRespuesta: string;
  accionPrioritaria?: string;
  observaciones?: string;
  fuenteOutlook?: string;
}

export interface CorreccionSLA {
  fecha: Date;
  cliente: string;
  estadoAnterior: string;
  estadoActualizado: string;
  motivo: string;
  fuente: string;
}

export interface OpcionesInforme {
  solicitudes: SolicitudSLA[];
  correcciones?: CorreccionSLA[];
  corte?: Date; // por defecto: ahora
  nota?: string; // texto de la fila "Nota" del resumen
  accionesPrioritarias?: string[]; // lista numerada del resumen
  festivos?: string; // texto de la fila "Festivos" de Criterios
}

/* ───────────── Estilos (copiados del archivo original) ───────────── */

const AZUL_ENCABEZADO = "FF1F4E78";
const AZUL_KPI = "FFDDEBF7";
const FMT_FECHA = "dd/mm/yyyy hh:mm";

const COLOR_ESTADO: Record<string, string> = {
  Respondida: "FFD9EAD3", // verde
  Cerrada: "FFD9EAD3", // verde
  "En gestión": "FFFFF2CC", // amarillo
  "SLA vencido": "FFF4CCCC", // rojo claro
  "Próxima a vencer": "FFFCE5CD", // naranja claro
  "Requiere validación": "FFEDEDED", // gris
  "No verificable": "FFEDEDED", // gris
};

const relleno = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

function estiloEncabezado(fila: ExcelJS.Row, centrado = true) {
  fila.eachCell((c) => {
    c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = relleno(AZUL_ENCABEZADO);
    c.alignment = centrado
      ? { horizontal: "center", vertical: "middle", wrapText: true }
      : { vertical: "top", wrapText: true };
  });
}

const alineacionCuerpo: Partial<ExcelJS.Alignment> = {
  vertical: "top",
  wrapText: true,
};

/* ───────────── Generador ───────────── */

export async function generarInformeSLA(opts: OpcionesInforme): Promise<Blob> {
  const {
    solicitudes,
    correcciones = [],
    corte = new Date(),
    nota = "",
    accionesPrioritarias = [],
    festivos = "",
  } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = "SLA Dashboard";
  wb.created = new Date();

  /* ── Hoja 1: Seguimiento SLA ── */
  const ws1 = wb.addWorksheet("Seguimiento SLA", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws1.columns = [
    { header: "Cliente", key: "cliente", width: 22 },
    { header: "Remitente", key: "remitente", width: 36 },
    { header: "País", key: "pais", width: 18 },
    { header: "Servicio", key: "servicio", width: 24 },
    { header: "Proceso", key: "proceso", width: 32 },
    { header: "Asunto", key: "asunto", width: 48 },
    { header: "Resumen", key: "resumen", width: 68 },
    { header: "Fecha recepción", key: "fechaRecepcion", width: 22 },
    { header: "Inicio conteo SLA", key: "inicioConteoSLA", width: 22 },
    { header: "Responsable", key: "responsable", width: 35 },
    { header: "Estado", key: "estado", width: 18 },
    { header: "Vencimiento SLA", key: "vencimientoSLA", width: 22 },
    { header: "Tiempo hábil", key: "tiempoHabil", width: 16 },
    { header: "Evidencia de respuesta", key: "evidenciaRespuesta", width: 70 },
    { header: "Acción prioritaria", key: "accionPrioritaria", width: 55 },
    { header: "Observaciones", key: "observaciones", width: 55 },
    { header: "Fuente Outlook", key: "fuenteOutlook", width: 18 },
  ];
  estiloEncabezado(ws1.getRow(1));

  solicitudes.forEach((s) => {
    const fila = ws1.addRow({
      ...s,
      accionPrioritaria: s.accionPrioritaria ?? "",
      observaciones: s.observaciones ?? "",
      fuenteOutlook: s.fuenteOutlook ?? "",
    });
    fila.height = 62.1;
    const argb = COLOR_ESTADO[s.estado];
    fila.eachCell({ includeEmpty: true }, (c) => {
      c.font = { name: "Calibri", size: 11 };
      c.alignment = alineacionCuerpo;
      if (argb) c.fill = relleno(argb);
    });
    ["fechaRecepcion", "inicioConteoSLA", "vencimientoSLA"].forEach((k) => {
      fila.getCell(k).numFmt = FMT_FECHA;
    });
  });

  /* ── Hoja 2: Resumen ejecutivo ── */
  const ws2 = wb.addWorksheet("Resumen ejecutivo");
  ws2.columns = [{ width: 48 }, { width: 80 }];

  ws2.getCell("A1").value = "Seguimiento SLA - Resumen ejecutivo";
  ws2.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: AZUL_ENCABEZADO } };
  ws2.getRow(1).height = 29.25;

  ws2.getCell("A2").value = "Corte";
  ws2.getCell("B2").value = corte;
  ws2.getCell("B2").numFmt = FMT_FECHA;
  ws2.getCell("A3").value = "Regla SLA primera respuesta";
  ws2.getCell("B3").value = "2 horas hábiles, lunes a viernes, 08:00-17:00, America/Bogota";
  ws2.getCell("A4").value = "Nota";
  ws2.getCell("B4").value = nota;
  [2, 3, 4].forEach((r) =>
    ws2.getRow(r).eachCell((c) => {
      c.alignment = alineacionCuerpo;
    })
  );

  // KPIs con fórmulas (igual que el original) + valor calculado para que se vean siempre
  const cuenta = (e: string) => solicitudes.filter((s) => s.estado === e).length;
  const total = solicitudes.length;
  const vencidas = cuenta("SLA vencido");

  const kpis: [string, string, number, string?][] = [
    ["Total solicitudes registradas", "COUNTA('Seguimiento SLA'!A2:A1048576)", total],
    ["SLA vencido", `COUNTIF('Seguimiento SLA'!K:K,"SLA vencido")`, vencidas],
    ["En gestión", `COUNTIF('Seguimiento SLA'!K:K,"En gestión")`, cuenta("En gestión")],
    ["Cerradas", `COUNTIF('Seguimiento SLA'!K:K,"Cerrada")`, cuenta("Cerrada")],
    ["Respondidas", `COUNTIF('Seguimiento SLA'!K:K,"Respondida")`, cuenta("Respondida")],
    ["Próximas a vencer", `COUNTIF('Seguimiento SLA'!K:K,"Próxima a vencer")`, cuenta("Próxima a vencer")],
    ["% dentro del SLA / sin vencimiento", "IF(B7=0,0,(B7-B8)/B7)", total === 0 ? 0 : (total - vencidas) / total, "0.0%"],
  ];
  kpis.forEach(([etiqueta, formula, resultado, fmt], i) => {
    const r = 7 + i;
    const a = ws2.getCell(`A${r}`);
    const b = ws2.getCell(`B${r}`);
    a.value = etiqueta;
    a.font = { name: "Calibri", size: 11, bold: true };
    b.value = { formula, result: resultado };
    if (fmt) b.numFmt = fmt;
    [a, b].forEach((c) => {
      c.fill = relleno(AZUL_KPI);
      c.alignment = { vertical: "top", wrapText: true };
    });
    b.alignment = { vertical: "top", horizontal: "left", wrapText: true };
  });

  ws2.getCell("A16").value = "Acciones prioritarias corregidas";
  ws2.getCell("A16").font = { name: "Calibri", size: 11, bold: true };
  accionesPrioritarias.forEach((txt, i) => {
    ws2.getCell(`A${17 + i}`).value = `${i + 1}. ${txt}`;
  });

  /* ── Hoja 3: Criterios SLA ── */
  const ws3 = wb.addWorksheet("Criterios SLA");
  ws3.columns = [{ width: 32 }, { width: 100 }];
  ws3.addRow(["Parámetro", "Valor"]);
  estiloEncabezado(ws3.getRow(1), false);
  const criterios: [string, string][] = [
    ["Zona horaria", "America/Bogota"],
    ["Horario hábil", "Lunes a viernes, 08:00-17:00"],
    ["SLA primera respuesta", "2 horas hábiles"],
    [
      "Estados permitidos",
      "Nueva, Asignada, Pendiente de respuesta, Próxima a vencer, SLA vencido, En gestión, Respondida, Cerrada, Requiere validación, No verificable",
    ],
    [
      "Primera respuesta sustancial",
      "Respuesta al cliente que atiende total/parcialmente la solicitud, pide información concreta, entrega orientación útil, o confirma acción y fecha razonable.",
    ],
    [
      "No sustancial",
      "Recibido, gracias, lo estamos revisando, pronto responderemos, respuestas automáticas o solo confirmaciones internas.",
    ],
    ["Festivos", festivos],
  ];
  criterios.forEach((par) => {
    const f = ws3.addRow(par);
    f.eachCell((c) => {
      c.alignment = alineacionCuerpo;
    });
  });

  /* ── Hoja 4: Registro de corrección ── */
  const ws4 = wb.addWorksheet("Registro de corrección");
  ws4.columns = [
    { header: "Fecha corrección", width: 22 },
    { header: "Cliente", width: 24 },
    { header: "Estado anterior", width: 18 },
    { header: "Estado actualizado", width: 18 },
    { header: "Motivo", width: 70 },
    { header: "Fuente de corrección", width: 36 },
  ];
  estiloEncabezado(ws4.getRow(1));
  correcciones.forEach((c) => {
    const f = ws4.addRow([c.fecha, c.cliente, c.estadoAnterior, c.estadoActualizado, c.motivo, c.fuente]);
    f.height = 42;
    f.eachCell((cell) => {
      cell.alignment = alineacionCuerpo;
    });
    f.getCell(1).numFmt = FMT_FECHA;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function nombreArchivoInforme(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `Seguimiento_SLA_-_${y}-${m}-${d}.xlsx`;
}