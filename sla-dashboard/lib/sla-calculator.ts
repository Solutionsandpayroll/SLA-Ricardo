// ======================================================
// CONFIGURACIÓN DEL SLA - COLOMBIA
// ======================================================

const SLA_HORAS = 2;

const MINUTOS_MANANA_INICIO = 8 * 60;       // 08:00
const MINUTOS_MANANA_FIN = 12 * 60 + 30;    // 12:30
const MINUTOS_TARDE_INICIO = 13 * 60 + 30;  // 13:30
const MINUTOS_TARDE_FIN = 17 * 60;          // 17:00

const MINUTOS_POR_HORA = 60;
const MILISEGUNDOS_POR_MINUTO = 60_000;

// Festivos oficiales de Colombia para 2026 y 2027.
// Se incluyen las fechas trasladadas al lunes cuando corresponde.

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
]);

// ======================================================
// UTILIDADES DE FECHA Y HORA
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

/**
 * Obtiene los componentes de una fecha en hora de Colombia.
 * Colombia utiliza UTC-5 durante todo el año.
 */
function obtenerFechaColombia(fecha: Date): FechaColombia {
  const fechaUTC = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);

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
 * Construye una fecha UTC a partir de una fecha y hora colombianas.
 * Los meses utilizan el formato de JavaScript: enero = 0.
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
 * Avanza un día calendario, conservando la hora colombiana.
 */
function avanzarDiaColombia(fecha: Date): Date {
  const partes = obtenerFechaColombia(fecha);

  return crearFechaColombia(
    partes.anio,
    partes.mes,
    partes.dia + 1,
    partes.horas,
    partes.minutos
  );
}

/**
 * Comprueba si una fecha corresponde a un día laboral.
 */
function esDiaLaboral(fecha: Date): boolean {
  const partes = obtenerFechaColombia(fecha);

  // Domingo = 0 y sábado = 6.
  if (partes.diaSemana === 0 || partes.diaSemana === 6) {
    return false;
  }

  if (FESTIVOS_COLOMBIA.has(partes.fechaStr)) {
    return false;
  }

  return true;
}

/**
 * Comprueba si la hora está dentro de los bloques laborales.
 *
 * Mañana: 08:00 a 12:30.
 * Tarde: 13:30 a 17:00.
 */
function esHorarioHabil(fecha: Date): boolean {
  const partes = obtenerFechaColombia(fecha);
  const minuto = partes.minutosDelDia;

  if (!esDiaLaboral(fecha)) {
    return false;
  }

  return (
    (minuto >= MINUTOS_MANANA_INICIO &&
      minuto < MINUTOS_MANANA_FIN) ||
    (minuto >= MINUTOS_TARDE_INICIO &&
      minuto < MINUTOS_TARDE_FIN)
  );
}

/**
 * Devuelve el siguiente momento hábil a partir de una fecha.
 */
function obtenerSiguienteMomentoHabil(fecha: Date): Date {
  let actual = new Date(fecha.getTime());

  for (let intentos = 0; intentos < 4000; intentos++) {
    const partes = obtenerFechaColombia(actual);

    if (!esDiaLaboral(actual)) {
      actual = crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia + 1,
        8,
        0
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
        8,
        0
      );
    }

    // Entre las 12:30 y las 13:30.
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

    // A partir de las 17:00.
    if (minuto >= MINUTOS_TARDE_FIN) {
      actual = crearFechaColombia(
        partes.anio,
        partes.mes,
        partes.dia + 1,
        8,
        0
      );
      continue;
    }

    // Ya se encuentra en horario hábil.
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
    17,
    0
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
  if (Number.isNaN(fechaRecepcion.getTime())) {
    throw new Error("La fecha de recepción no es válida.");
  }

  if (esHorarioHabil(fechaRecepcion)) {
    return new Date(fechaRecepcion.getTime());
  }

  return obtenerSiguienteMomentoHabil(fechaRecepcion);
}

// ======================================================
// CÁLCULO DE MINUTOS HÁBILES
// ======================================================

/**
 * Agrega una cantidad de minutos hábiles a una fecha.
 * No cuenta almuerzos, fines de semana ni festivos.
 */
function agregarMinutosHabiles(
  fechaInicio: Date,
  minutos: number
): Date {
  if (Number.isNaN(fechaInicio.getTime())) {
    throw new Error("La fecha inicial no es válida.");
  }

  if (!Number.isFinite(minutos) || minutos < 0) {
    throw new Error("La cantidad de minutos no es válida.");
  }

  let actual = obtenerSiguienteMomentoHabil(fechaInicio);
  let restantes = minutos;

  while (restantes > 0) {
    actual = obtenerSiguienteMomentoHabil(actual);

    const finBloque = obtenerFinBloqueHabil(actual);

    const minutosDisponibles =
      (finBloque.getTime() - actual.getTime()) /
      MILISEGUNDOS_POR_MINUTO;

    if (restantes <= minutosDisponibles) {
      actual = new Date(
        actual.getTime() +
          restantes * MILISEGUNDOS_POR_MINUTO
      );

      restantes = 0;
    } else {
      restantes -= minutosDisponibles;

      // Al terminar un bloque, se buscará el siguiente momento hábil.
      actual = finBloque;
    }
  }

  return actual;
}

/**
 * Calcula los minutos hábiles transcurridos entre dos fechas.
 */
function calcularMinutosHabilesTranscurridos(
  fechaInicio: Date,
  fechaFin: Date
): number {
  if (
    Number.isNaN(fechaInicio.getTime()) ||
    Number.isNaN(fechaFin.getTime())
  ) {
    throw new Error("Una de las fechas proporcionadas no es válida.");
  }

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
      finBloque < fechaFin ? finBloque : fechaFin;

    total +=
      (finIntervalo.getTime() - actual.getTime()) /
      MILISEGUNDOS_POR_MINUTO;

    actual = finIntervalo;
  }

  return Math.max(0, total);
}

// ======================================================
// VENCIMIENTO DEL SLA
// ======================================================

/**
 * Calcula la fecha límite de respuesta.
 * Por defecto, el plazo es de dos horas hábiles.
 */
export function calcularVencimientoSLA(
  inicioConteo: Date,
  horasSLA: number = SLA_HORAS
): Date {
  if (!Number.isFinite(horasSLA) || horasSLA < 0) {
    throw new Error("La cantidad de horas SLA no es válida.");
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
 * Devuelve el tiempo hábil en formato "X h YY min".
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

  const horas = Math.floor(minutosTotales / 60);
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
 * Clasifica el SLA según el vencimiento real.
 *
 * Para solicitudes sin respuesta:
 * - Vencido: se alcanzó o superó la fecha límite.
 * - Próximo a vencer: quedan 30 minutos hábiles o menos.
 * - Dentro del SLA: todavía tiene más de 30 minutos hábiles.
 *
 * Para solicitudes respondidas:
 * - Dentro del SLA: respuesta a tiempo.
 * - Vencido: respuesta posterior al vencimiento.
 */
export function clasificarSLA(
  inicioConteo: Date,
  vencimiento: Date,
  fechaRespuesta?: Date
): EstadoSLA {
  if (
    Number.isNaN(inicioConteo.getTime()) ||
    Number.isNaN(vencimiento.getTime())
  ) {
    return "no_verificable";
  }

  if (
    fechaRespuesta &&
    Number.isNaN(fechaRespuesta.getTime())
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
    calcularMinutosHabilesTranscurridos(ahora, vencimiento);

  if (minutosRestantes <= 30) {
    return "proximo_vencer";
  }

  return "dentro_sla";
}

// ======================================================
// CÁLCULO COMPLETO DEL SLA
// ======================================================

/**
 * Calcula todos los campos utilizados por la API:
 * inicio, vencimiento, tiempo hábil y estado.
 */
export function calcularSLA(
  fechaRecepcion: Date,
  fechaRespuesta?: Date
) {
  const inicioConteoSLA =
    calcularInicioConteoSLA(fechaRecepcion);

  const vencimientoSLA =
    calcularVencimientoSLA(inicioConteoSLA);

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