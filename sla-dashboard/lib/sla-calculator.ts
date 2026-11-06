import { config } from "./config";

// ======================================================
// CONFIGURACIÓN DEL SLA - COLOMBIA
// ======================================================

const SLA_HORAS = config.sla.horasPorDefecto;
const MINUTOS_ALERTA_PROXIMO = config.sla.minutosAlertaProximo;

const MINUTOS_MANANA_INICIO = 8 * 60;
const MINUTOS_MANANA_FIN = 12 * 60 + 30;
const MINUTOS_TARDE_INICIO = 13 * 60 + 30;
const MINUTOS_TARDE_FIN = 17 * 60;

const MINUTOS_POR_HORA = 60;
const MILISEGUNDOS_POR_MINUTO = 60_000;
const OFFSET_COLOMBIA = 5 * 60 * 60 * 1000;

// Festivos oficiales de Colombia: 2026, 2027 y 2028.

const FESTIVOS_COLOMBIA = new Set([
  // 2026
  "2026-01-01",
  "2026-01-12",
  "2026-03-23",
  "2026-04-02",
  "2026-04-03",
  "2026-05-01",
  "2026-05-18",
  "2026-06-08",
  "2026-06-15",
  "2026-06-29",
  "2026-07-20",
  "2026-08-07",
  "2026-08-17",
  "2026-10-12",
  "2026-11-02",
  "2026-11-16",
  "2026-12-08",
  "2026-12-25",

  // 2027
  "2027-01-01",
  "2027-01-11",
  "2027-03-22",
  "2027-03-25",
  "2027-03-26",
  "2027-05-01",
  "2027-05-10",
  "2027-05-31",
  "2027-06-07",
  "2027-06-28",
  "2027-07-20",
  "2027-08-07",
  "2027-08-16",
  "2027-10-18",
  "2027-11-01",
  "2027-11-15",
  "2027-12-08",
  "2027-12-25",

  // 2028
  "2028-01-01",
  "2028-01-10",
  "2028-03-20",
  "2028-04-13",
  "2028-04-14",
  "2028-05-01",
  "2028-05-29",
  "2028-06-19",
  "2028-06-26",
  "2028-07-03",
  "2028-07-20",
  "2028-08-07",
  "2028-08-21",
  "2028-10-16",
  "2028-11-06",
  "2028-11-13",
  "2028-12-08",
  "2028-12-25",
]);

// ======================================================
// INTERFACES
// ======================================================

interface FechaColombia {
  anio: number;
  mes: number;
  dia: number;
  horas: number;
  minutos: number;
  diaSemana: number;
  fechaStr: string;
  minutosDelDia: number;
}

// ======================================================
// VALIDACIÓN DE FECHAS
// ======================================================

function validarFecha(fecha: Date): void {
  if (
    !(fecha instanceof Date) ||
    !Number.isFinite(fecha.getTime())
  ) {
    throw new Error("La fecha proporcionada no es válida.");
  }
}

// ======================================================
// UTILIDADES DE FECHA Y HORA
// ======================================================

/**
 * Convierte una fecha UTC a componentes de hora colombiana.
 * Colombia utiliza UTC-5 durante todo el año.
 */
function obtenerFechaColombia(fecha: Date): FechaColombia {
  validarFecha(fecha);

  const fechaUTC = new Date(
    fecha.getTime() - OFFSET_COLOMBIA
  );

  const anio = fechaUTC.getUTCFullYear();
  const mes = fechaUTC.getUTCMonth();
  const dia = fechaUTC.getUTCDate();
  const horas = fechaUTC.getUTCHours();
  const minutos = fechaUTC.getUTCMinutes();

  return {
    anio,
    mes,
    dia,
    horas,
    minutos,
    diaSemana: fechaUTC.getUTCDay(),
    fechaStr: [
      anio,
      String(mes + 1).padStart(2, "0"),
      String(dia).padStart(2, "0"),
    ].join("-"),
    minutosDelDia: horas * 60 + minutos,
  };
}

/**
 * Construye una fecha UTC desde componentes de hora colombiana.
 * Mes: enero = 0.
 */
function crearFechaColombia(
  anio: number,
  mes: number,
  dia: number,
  horas: number,
  minutos = 0
): Date {
  return new Date(
    Date.UTC(anio, mes, dia, horas + 5, minutos, 0, 0)
  );
}

/**
 * Comprueba si es un día laboral.
 */
function esDiaLaboral(fecha: Date): boolean {
  const partes = obtenerFechaColombia(fecha);

  const esFinDeSemana =
    partes.diaSemana === 0 ||
    partes.diaSemana === 6;

  return (
    !esFinDeSemana &&
    !FESTIVOS_COLOMBIA.has(partes.fechaStr)
  );
}

/**
 * Comprueba si la fecha está dentro del horario laboral.
 */
function esHorarioHabil(fecha: Date): boolean {
  const partes = obtenerFechaColombia(fecha);
  const minuto = partes.minutosDelDia;

  return (
    esDiaLaboral(fecha) &&
    (
      (
        minuto >= MINUTOS_MANANA_INICIO &&
        minuto < MINUTOS_MANANA_FIN
      ) ||
      (
        minuto >= MINUTOS_TARDE_INICIO &&
        minuto < MINUTOS_TARDE_FIN
      )
    )
  );
}

/**
 * Obtiene el siguiente momento hábil.
 */
function obtenerSiguienteMomentoHabil(
  fecha: Date
): Date {
  validarFecha(fecha);

  let actual = new Date(fecha.getTime());

  for (let intentos = 0; intentos < 4000; intentos++) {
    const partes = obtenerFechaColombia(actual);

    if (!esDiaLaboral(actual)) {
      actual = crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia + 1,
        8
      );

      continue;
    }

    const minuto = partes.minutosDelDia;

    // Antes de las 08:00.
    if (minuto < MINUTOS_MANANA_INICIO) {
      return crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia,
        8
      );
    }

    // Pausa de almuerzo.
    if (
      minuto >= MINUTOS_MANANA_FIN &&
      minuto < MINUTOS_TARDE_INICIO
    ) {
      return crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia,
        13,
        30
      );
    }

    // Después de las 17:00.
    if (minuto >= MINUTOS_TARDE_FIN) {
      actual = crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia + 1,
        8
      );

      continue;
    }

    return actual;
  }

  throw new Error(
    "No fue posible encontrar el siguiente momento hábil."
  );
}

/**
 * Obtiene el final del bloque laboral actual.
 */
function obtenerFinBloqueHabil(fecha: Date): Date {
  const partes = obtenerFechaColombia(fecha);

  if (partes.minutosDelDia < MINUTOS_MANANA_FIN) {
    return crearFechaColombia(
      partes.anio,
      partes.mes,
      partes.dia,
      12,
      30
    );
  }

  return crearFechaColombia(
    partes.anio,
    partes.mes,
    partes.dia,
    17
  );
}

// ======================================================
// INICIO DEL CONTEO SLA
// ======================================================

/**
 * Calcula cuándo debe comenzar el conteo del SLA.
 */
export function calcularInicioConteoSLA(
  fechaRecepcion: Date
): Date {
  validarFecha(fechaRecepcion);

  if (esHorarioHabil(fechaRecepcion)) {
    return new Date(fechaRecepcion.getTime());
  }

  return obtenerSiguienteMomentoHabil(fechaRecepcion);
}

// ======================================================
// CÁLCULO DE MINUTOS HÁBILES
// ======================================================

/**
 * Agrega minutos hábiles a una fecha.
 * Excluye almuerzos, fines de semana y festivos.
 */
function agregarMinutosHabiles(
  fechaInicio: Date,
  minutos: number
): Date {
  validarFecha(fechaInicio);

  if (!Number.isFinite(minutos) || minutos < 0) {
    throw new Error(
      "La cantidad de minutos no es válida."
    );
  }

  let actual = obtenerSiguienteMomentoHabil(fechaInicio);
  let restantes = minutos;

  while (restantes > 0) {
    const finBloque = obtenerFinBloqueHabil(actual);

    const minutosDisponibles =
      (finBloque.getTime() - actual.getTime()) /
      MILISEGUNDOS_POR_MINUTO;

    if (restantes <= minutosDisponibles) {
      return new Date(
        actual.getTime() +
        restantes * MILISEGUNDOS_POR_MINUTO
      );
    }

    restantes -= minutosDisponibles;

    actual = obtenerSiguienteMomentoHabil(finBloque);
  }

  return actual;
}

/**
 * Calcula los minutos hábiles entre dos fechas.
 */
function calcularMinutosHabilesTranscurridos(
  fechaInicio: Date,
  fechaFin: Date
): number {
  validarFecha(fechaInicio);
  validarFecha(fechaFin);

  if (fechaFin <= fechaInicio) {
    return 0;
  }

  let actual = new Date(fechaInicio.getTime());
  let total = 0;

  while (actual < fechaFin) {
    actual = obtenerSiguienteMomentoHabil(actual);

    if (actual >= fechaFin) {
      break;
    }

    const finBloque = obtenerFinBloqueHabil(actual);

    const finIntervalo =
      finBloque < fechaFin
        ? finBloque
        : fechaFin;

    total += (
      finIntervalo.getTime() - actual.getTime()
    ) / MILISEGUNDOS_POR_MINUTO;

    actual = finIntervalo;
  }

  return Math.max(0, total);
}

// ======================================================
// VENCIMIENTO DEL SLA
// ======================================================

/**
 * Calcula la fecha límite de respuesta.
 * Si no se indica el plazo, usa el configurado por defecto (config.sla.horasPorDefecto).
 */
export function calcularVencimientoSLA(
  inicioConteo: Date,
  horasSLA: number = SLA_HORAS
): Date {
  validarFecha(inicioConteo);

  if (
    !Number.isFinite(horasSLA) ||
    horasSLA < 0
  ) {
    throw new Error(
      "La cantidad de horas SLA no es válida."
    );
  }

  return agregarMinutosHabiles(
    inicioConteo,
    horasSLA * MINUTOS_POR_HORA
  );
}

// ======================================================
// TIEMPO HÁBIL TRANSCURRIDO
// ======================================================

/**
 * Devuelve el tiempo hábil en formato X h YY min.
 */
export function calcularTiempoHabil(
  fechaInicio: Date,
  fechaFin: Date
): string {
  const minutosTotales = Math.round(
    calcularMinutosHabilesTranscurridos(
      fechaInicio,
      fechaFin
    )
  );

  const horas = Math.floor(
    minutosTotales / 60
  );

  const minutos = minutosTotales % 60;

  return `${horas} h ${String(minutos).padStart(2, "0")} min`;
}

// ======================================================
// CLASIFICACIÓN DEL ESTADO SLA
// ======================================================

export type EstadoSLA =
  | "dentro_sla"
  | "proximo_vencer"
  | "vencido"
  | "no_verificable";

/**
 * Clasifica el estado de una solicitud.
 */
export function clasificarSLA(
  inicioConteo: Date,
  vencimiento: Date,
  fechaRespuesta?: Date
): EstadoSLA {
  if (
    !(inicioConteo instanceof Date) ||
    !(vencimiento instanceof Date) ||
    !Number.isFinite(inicioConteo.getTime()) ||
    !Number.isFinite(vencimiento.getTime())
  ) {
    return "no_verificable";
  }

  if (
    fechaRespuesta &&
    (
      !(fechaRespuesta instanceof Date) ||
      !Number.isFinite(fechaRespuesta.getTime())
    )
  ) {
    return "no_verificable";
  }

  if (fechaRespuesta) {
    return fechaRespuesta <= vencimiento
      ? "dentro_sla"
      : "vencido";
  }

  const ahora = new Date();

  if (ahora >= vencimiento) {
    return "vencido";
  }

  const minutosRestantes =
    calcularMinutosHabilesTranscurridos(
      ahora,
      vencimiento
    );

  return minutosRestantes <= MINUTOS_ALERTA_PROXIMO
    ? "proximo_vencer"
    : "dentro_sla";
}

// ======================================================
// CÁLCULO COMPLETO DEL SLA
// ======================================================

/**
 * Calcula todos los campos utilizados por la API.
 * horasSLA es opcional: usar el slaHoras de la solicitud.
 * Si viene vacío (null/undefined), se usa el plazo por defecto.
 */
export function calcularSLA(
  fechaRecepcion: Date,
  fechaRespuesta?: Date,
  horasSLA?: number | null
) {
  const inicioConteoSLA =
    calcularInicioConteoSLA(fechaRecepcion);

  const vencimientoSLA = calcularVencimientoSLA(
    inicioConteoSLA,
    horasSLA ?? SLA_HORAS
  );

  if (
    fechaRespuesta &&
    !Number.isFinite(fechaRespuesta.getTime())
  ) {
    throw new Error(
      "La fecha de respuesta no es válida."
    );
  }

  const fechaFin = fechaRespuesta || new Date();

  const tiempoHabil = calcularTiempoHabil(
    inicioConteoSLA,
    fechaFin
  );

  const estadoSLA = clasificarSLA(
    inicioConteoSLA,
    vencimientoSLA,
    fechaRespuesta
  );

  return {
    inicioConteoSLA,
    vencimientoSLA,
    tiempoHabil,
    estadoSLA,
  };
}