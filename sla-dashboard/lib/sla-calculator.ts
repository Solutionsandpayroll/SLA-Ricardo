// Configuración de horario laboral Colombia
const HORARIO_MANANA_INICIO = 8; // 8:00 AM
const HORARIO_MANANA_FIN = 12; // 12:00 PM (mediodía)
const HORARIO_MANANA_FIN_MIN = 30; // 12:30 PM
const HORARIO_TARDE_INICIO = 13; // 1:00 PM
const HORARIO_TARDE_INICIO_MIN = 30; // 1:30 PM
const HORARIO_TARDE_FIN = 17; // 5:00 PM
const SLA_HORAS = 2; // 2 horas hábiles

// Festivos oficiales de Colombia 2026-2027
const FESTIVOS_COLOMBIA = [
  // 2026
  "2026-01-01", // Año Nuevo
  "2026-01-12", // Día de los Reyes Magos (trasladado)
  "2026-03-23", // Día de San José (trasladado)
  "2026-04-02", // Jueves Santo
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajo
  "2026-05-18", // Ascensión del Señor (trasladado)
  "2026-06-08", // Corpus Christi (trasladado)
  "2026-06-15", // Sagrado Corazón (trasladado)
  "2026-07-04", // San Pedro y San Pablo (trasladado)
  "2026-07-20", // Día de la Independencia
  "2026-08-07", // Batalla de Boyacá
  "2026-08-17", // Asunción de la Virgen (trasladado)
  "2026-10-12", // Día de la Raza (trasladado)
  "2026-11-02", // Todos los Santos (trasladado)
  "2026-11-16", // Independencia de Cartagena (trasladado)
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad
  // 2027
  "2027-01-01", // Año Nuevo
  "2027-01-11", // Día de los Reyes Magos (trasladado)
  "2027-03-22", // Día de San José (trasladado)
  "2027-04-22", // Jueves Santo
  "2027-04-23", // Viernes Santo
  "2027-05-01", // Día del Trabajo
  "2027-05-10", // Ascensión del Señor (trasladado)
  "2027-05-31", // Corpus Christi (trasladado)
  "2027-06-07", // Sagrado Corazón (trasladado)
  "2027-07-05", // San Pedro y San Pablo (trasladado)
  "2027-07-20", // Día de la Independencia
  "2027-08-07", // Batalla de Boyacá
  "2027-08-16", // Asunción de la Virgen (trasladado)
  "2027-10-18", // Día de la Raza (trasladado)
  "2027-11-01", // Todos los Santos (trasladado)
  "2027-11-15", // Independencia de Cartagena (trasladado)
  "2027-12-08", // Inmaculada Concepción
  "2027-12-25", // Navidad
];

/**
 * Obtiene la hora en Colombia (UTC-5)
 */
function getColombiaTime(date: Date): { hours: number; minutes: number; day: number; dateStr: string } {
  // Colombia está en UTC-5
  const colombiaTime = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return {
    hours: colombiaTime.getUTCHours(),
    minutes: colombiaTime.getUTCMinutes(),
    day: colombiaTime.getUTCDay(),
    dateStr: colombiaTime.toISOString().split("T")[0],
  };
}

/**
 * Verifica si una fecha es día laboral (lunes a viernes, no festivo)
 */
function esDiaLaboral(date: Date): boolean {
  const colombia = getColombiaTime(date);
  
  // Fin de semana (domingo = 0, sábado = 6)
  if (colombia.day === 0 || colombia.day === 6) return false;
  
  // Festivo
  if (FESTIVOS_COLOMBIA.includes(colombia.dateStr)) return false;
  
  return true;
}

/**
 * Verifica si una hora está en horario hábil
 */
function esHorarioHabil(date: Date): boolean {
  const colombia = getColombiaTime(date);
  const horaDecimal = colombia.hours + colombia.minutes / 60;
  
  // Bloque de la mañana: 8:00 - 12:30
  if (horaDecimal >= 8 && horaDecimal < 12.5) return true;
  
  // Bloque de la tarde: 13:30 - 17:00
  if (horaDecimal >= 13.5 && horaDecimal < 17) return true;
  
  return false;
}

/**
 * Convierte horas y minutos a minutos desde medianoche
 */
function aMinutos(horas: number, minutos: number): number {
  return horas * 60 + minutos;
}

/**
 * Obtiene el siguiente momento hábil desde una fecha
 */
function obtenerSiguienteMomentoHabil(date: Date): Date {
  const resultado = new Date(date);
  
  // Si no es día laboral, avanzar al siguiente día hábil a las 8:00 AM
  while (!esDiaLaboral(resultado)) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);
    resultado.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
  }
  
  const colombia = getColombiaTime(resultado);
  const horaDecimal = colombia.hours + colombia.minutes / 60;
  
  // Si está antes de las 8:00 AM, iniciar a las 8:00 AM
  if (horaDecimal < 8) {
    resultado.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
    return resultado;
  }
  
  // Si está en la pausa de almuerzo (12:30 - 13:30), iniciar a las 13:30
  if (horaDecimal >= 12.5 && horaDecimal < 13.5) {
    resultado.setUTCHours(18, 30, 0, 0); // 1:30 PM Colombia = 18:30 UTC
    return resultado;
  }
  
  // Si está después de las 17:00, avanzar al siguiente día hábil a las 8:00 AM
  if (horaDecimal >= 17) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);
    while (!esDiaLaboral(resultado)) {
      resultado.setUTCDate(resultado.getUTCDate() + 1);
    }
    resultado.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
    return resultado;
  }
  
  return resultado;
}

/**
 * Calcula el inicio del conteo SLA
 */
export function calcularInicioConteoSLA(fechaRecepcion: Date): Date {
  // Si llega dentro del horario hábil, iniciar en la hora de recepción
  if (esDiaLaboral(fechaRecepcion) && esHorarioHabil(fechaRecepcion)) {
    return fechaRecepcion;
  }
  
  // Si llega fuera del horario hábil, iniciar en el siguiente momento hábil
  return obtenerSiguienteMomentoHabil(fechaRecepcion);
}

/**
 * Agrega minutos hábiles a una fecha
 */
function agregarMinutosHabiles(fechaInicio: Date, minutos: number): Date {
  const resultado = new Date(fechaInicio);
  let minutosRestantes = minutos;
  
  while (minutosRestantes > 0) {
    // Si no es día laboral, avanzar al siguiente día hábil
    while (!esDiaLaboral(resultado)) {
      resultado.setUTCDate(resultado.getUTCDate() + 1);
      resultado.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
    }
    
    const colombia = getColombiaTime(resultado);
    const horaDecimal = colombia.hours + colombia.minutes / 60;
    
    // Si está en el bloque de la mañana (8:00 - 12:30)
    if (horaDecimal >= 8 && horaDecimal < 12.5) {
      const minutosHastaFinBloque = (12.5 - horaDecimal) * 60;
      if (minutosRestantes <= minutosHastaFinBloque) {
        // Los minutos restantes caben en este bloque
        const nuevosMinutos = colombia.minutes + minutosRestantes;
        resultado.setUTCMinutes(resultado.getUTCMinutes() + minutosRestantes);
        minutosRestantes = 0;
      } else {
        // Avanzar al bloque de la tarde
        minutosRestantes -= minutosHastaFinBloque;
        resultado.setUTCHours(18, 30, 0, 0); // 1:30 PM Colombia = 18:30 UTC
      }
    }
    // Si está en el bloque de la tarde (13:30 - 17:00)
    else if (horaDecimal >= 13.5 && horaDecimal < 17) {
      const minutosHastaFinBloque = (17 - horaDecimal) * 60;
      if (minutosRestantes <= minutosHastaFinBloque) {
        // Los minutos restantes caben en este bloque
        resultado.setUTCMinutes(resultado.getUTCMinutes() + minutosRestantes);
        minutosRestantes = 0;
      } else {
        // Avanzar al siguiente día hábil
        minutosRestantes -= minutosHastaFinBloque;
        resultado.setUTCDate(resultado.getUTCDate() + 1);
        while (!esDiaLaboral(resultado)) {
          resultado.setUTCDate(resultado.getUTCDate() + 1);
        }
        resultado.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
      }
    }
    // Si está fuera del horario hábil, avanzar al siguiente momento hábil
    else {
      const siguienteHabil = obtenerSiguienteMomentoHabil(resultado);
      resultado.setTime(siguienteHabil.getTime());
    }
  }
  
  return resultado;
}

/**
 * Calcula el vencimiento del SLA
 */
export function calcularVencimientoSLA(inicioConteo: Date, horasSLA: number = SLA_HORAS): Date {
  const minutosSLA = horasSLA * 60;
  return agregarMinutosHabiles(inicioConteo, minutosSLA);
}

/**
 * Calcula los minutos hábiles transcurridos entre dos fechas
 */
function calcularMinutosHabilesTranscurridos(fechaInicio: Date, fechaFin: Date): number {
  let minutosTotales = 0;
  const actual = new Date(fechaInicio);
  
  while (actual < fechaFin) {
    // Si no es día laboral, avanzar al siguiente día hábil
    while (!esDiaLaboral(actual)) {
      actual.setUTCDate(actual.getUTCDate() + 1);
      actual.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
    }
    
    const colombia = getColombiaTime(actual);
    const horaDecimal = colombia.hours + colombia.minutes / 60;
    
    // Si está en el bloque de la mañana (8:00 - 12:30)
    if (horaDecimal >= 8 && horaDecimal < 12.5) {
      const finBloque = new Date(actual);
      const minutosHastaFinBloque = (12.5 - horaDecimal) * 60;
      finBloque.setUTCMinutes(finBloque.getUTCMinutes() + minutosHastaFinBloque);
      
      const siguienteMomento = finBloque < fechaFin ? finBloque : fechaFin;
      minutosTotales += (siguienteMomento.getTime() - actual.getTime()) / (1000 * 60);
      actual.setTime(siguienteMomento.getTime());
      
      if (actual >= finBloque && actual < fechaFin) {
        actual.setUTCHours(18, 30, 0, 0); // 1:30 PM Colombia = 18:30 UTC
      }
    }
    // Si está en el bloque de la tarde (13:30 - 17:00)
    else if (horaDecimal >= 13.5 && horaDecimal < 17) {
      const finBloque = new Date(actual);
      const minutosHastaFinBloque = (17 - horaDecimal) * 60;
      finBloque.setUTCMinutes(finBloque.getUTCMinutes() + minutosHastaFinBloque);
      
      const siguienteMomento = finBloque < fechaFin ? finBloque : fechaFin;
      minutosTotales += (siguienteMomento.getTime() - actual.getTime()) / (1000 * 60);
      actual.setTime(siguienteMomento.getTime());
      
      if (actual >= finBloque && actual < fechaFin) {
        actual.setUTCDate(actual.getUTCDate() + 1);
        while (!esDiaLaboral(actual)) {
          actual.setUTCDate(actual.getUTCDate() + 1);
        }
        actual.setUTCHours(13, 0, 0, 0); // 8:00 AM Colombia = 13:00 UTC
      }
    }
    // Si está fuera del horario hábil, avanzar al siguiente momento hábil
    else {
      const siguienteHabil = obtenerSiguienteMomentoHabil(actual);
      actual.setTime(siguienteHabil.getTime());
    }
  }
  
  return minutosTotales;
}

/**
 * Calcula el tiempo hábil transcurrido en formato legible
 */
export function calcularTiempoHabil(fechaInicio: Date, fechaFin: Date): string {
  const minutosTotales = calcularMinutosHabilesTranscurridos(fechaInicio, fechaFin);
  const horas = Math.floor(minutosTotales / 60);
  const minutos = Math.round(minutosTotales % 60);
  
  return `${horas} h ${minutos.toString().padStart(2, "0")} min`;
}

/**
 * Clasifica el estado del SLA
 */
export function clasificarSLA(
  inicioConteo: Date,
  vencimiento: Date,
  fechaRespuesta?: Date
): "dentro_sla" | "proximo_vencer" | "vencido" | "no_verificable" {
  const ahora = new Date();
  
  // Si no hay respuesta, verificar el tiempo transcurrido
  if (!fechaRespuesta) {
    const minutosTranscurridos = calcularMinutosHabilesTranscurridos(inicioConteo, ahora);
    const minutosSLA = SLA_HORAS * 60;
    
    // Vencido: más de 2 horas hábiles
    if (minutosTranscurridos > minutosSLA) {
      return "vencido";
    }
    
    // Próximo a vencer: al menos 90 minutos transcurridos
    if (minutosTranscurridos >= 90) {
      return "proximo_vencer";
    }
    
    // Dentro del SLA
    return "dentro_sla";
  }
  
  // Si hay respuesta, verificar si fue antes del vencimiento
  if (fechaRespuesta <= vencimiento) {
    return "dentro_sla";
  }
  
  return "vencido";
}

/**
 * Calcula todos los campos de SLA para una solicitud
 */
export function calcularSLA(fechaRecepcion: Date, fechaRespuesta?: Date) {
  const inicioConteo = calcularInicioConteoSLA(fechaRecepcion);
  const vencimiento = calcularVencimientoSLA(inicioConteo);
  
  // Calcular tiempo hábil hasta la respuesta o hasta ahora
  const fechaFin = fechaRespuesta || new Date();
  const tiempoHabil = calcularTiempoHabil(inicioConteo, fechaFin);
  const estadoSLA = clasificarSLA(inicioConteo, vencimiento, fechaRespuesta);
  
  return {
    inicioConteoSLA: inicioConteo,
    vencimientoSLA: vencimiento,
    tiempoHabil,
    estadoSLA,
  };
}
