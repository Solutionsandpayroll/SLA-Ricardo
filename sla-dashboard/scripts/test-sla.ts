import { calcularSLA } from "../lib/sla-calculator";

const fechaPrueba = new Date("2026-09-01T10:00:00Z");
console.log("Fecha de recepción:", fechaPrueba.toISOString());

try {
  const sla = calcularSLA(fechaPrueba);
  console.log("Inicio conteo SLA:", sla.inicioConteoSLA);
  console.log("Vencimiento SLA:", sla.vencimientoSLA);
  console.log("Tiempo hábil:", sla.tiempoHabil);
  console.log("Estado SLA:", sla.estadoSLA);
} catch (error) {
  console.error("Error calculando SLA:", error);
}
