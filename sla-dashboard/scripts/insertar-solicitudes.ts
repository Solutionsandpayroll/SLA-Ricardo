import { PrismaClient } from '@prisma/client'
import { calcularSLA } from '../lib/sla-calculator'

const prisma = new PrismaClient()

const solicitudesDetectadas = [
  {
    asunto: "RE: PRORROGA N2 CRISTIAN FERNEY PARADA CABRERA",
    remitente: "cristian.parada@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T10:00:00Z"),
    cuerpo: "Por favor proceder con la prórroga.",
    nombreCliente: "Cristian Ferney Parada Cabrera",
    tipoProceso: "Prórroga",
    paisCliente: "Colombia",
    estado: "en_gestion",
  },
  {
    asunto: "RE: WRBR - Discovery - CO | Mensual | Novedades 202608 (ICP)",
    remitente: "john.doe@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T11:00:00Z"),
    cuerpo: "Comentarios sobre novedades de nómina agosto 2026.",
    nombreCliente: "Discovery",
    tipoProceso: "Novedades de nómina",
    paisCliente: "Colombia",
    estado: "en_gestion",
  },
  {
    asunto: "RE: RKWL Colombia | Solicitud cálculo de terminación 90715934",
    remitente: "jane.smith@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T12:00:00Z"),
    cuerpo: "Solicitud de cálculo de terminación.",
    nombreCliente: "RKWL",
    tipoProceso: "Cálculo de terminación",
    paisCliente: "Colombia",
    estado: "en_gestion",
  },
  {
    asunto: "RE: Factura Junio - Agosto",
    remitente: "billing@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T13:00:00Z"),
    cuerpo: "Solicitud de formato PEP pendiente por diligenciar.",
    nombreCliente: null,
    tipoProceso: "Facturación",
    paisCliente: null,
    estado: "en_gestion",
  },
  {
    asunto: "Re: TC05 - ICO - Vacaciones Roberto Florez - ICP",
    remitente: "roberto.florez@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T14:00:00Z"),
    cuerpo: "Solicitud de vacaciones para Roberto Florez.",
    nombreCliente: "Roberto Florez",
    tipoProceso: "Vacaciones",
    paisCliente: "Colombia",
    estado: "en_gestion",
  },
  {
    asunto: "RE: Solicitud de anulación de planilla AFPnet",
    remitente: "rrhh@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-01T15:00:00Z"),
    cuerpo: "Anulación de planilla AFPnet por modificación de liquidación.",
    nombreCliente: null,
    tipoProceso: "Anulación de planilla",
    paisCliente: null,
    estado: "en_gestion",
  },
  {
    asunto: "RE: Dato a pagar de nómina, seguridad social, retención y otros pagos a realizar Septiembre 2026 – Guatemala S&P y Safeguard",
    remitente: "payroll@safeguardglobal.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-02T09:00:00Z"),
    cuerpo: "Datos a pagar de nómina y seguridad social.",
    nombreCliente: null,
    tipoProceso: "Nómina",
    paisCliente: "Guatemala",
    estado: "en_gestion",
  },
  {
    asunto: "RV: Solicitud anticipo prima legal - Nathalie Vaquiro",
    remitente: "nathalie.vaquiro@remofirst.com",
    encargado: "William Romero",
    fechaRecibido: new Date("2026-09-02T10:00:00Z"),
    cuerpo: "Solicitud de anticipo de prima legal para Nathalie Vaquiro.",
    nombreCliente: "Nathalie Vaquiro",
    tipoProceso: "Anticipo de prima",
    paisCliente: "Colombia",
    estado: "en_gestion",
  },
]

async function insertarSolicitudes() {
  console.log("Limpiando solicitudes anteriores...\n")
  
  try {
    await prisma.solicitud.deleteMany()
    console.log("✓ Solicitudes anteriores eliminadas\n")
  } catch (error) {
    console.error("Error limpiando solicitudes:", error)
  }

  console.log("Insertando solicitudes detectadas en los logs...\n")

  for (const sol of solicitudesDetectadas) {
    try {
      // Calcular SLA
      const sla = calcularSLA(sol.fechaRecibido)

      const creada = await prisma.solicitud.create({
        data: {
          asunto: sol.asunto,
          cuerpo: sol.cuerpo,
          remitente: sol.remitente,
          encargado: sol.encargado,
          fechaRecibido: sol.fechaRecibido,
          inicioConteoSLA: sla.inicioConteoSLA,
          vencimientoSLA: sla.vencimientoSLA,
          tiempoHabil: sla.tiempoHabil,
          estadoSLA: sla.estadoSLA,
          estado: sol.estado,
          clasificacionIA: "SOLICITUD",
          confianzaIA: 0.85,
          nombreCliente: sol.nombreCliente,
          tipoProceso: sol.tipoProceso,
          paisCliente: sol.paisCliente,
        },
      })
      console.log(`✓ Insertada: ${sol.asunto.substring(0, 60)}...`)
      console.log(`  Inicio SLA: ${sla.inicioConteoSLA.toLocaleString("es-CO")}`)
      console.log(`  Vencimiento: ${sla.vencimientoSLA.toLocaleString("es-CO")}`)
    } catch (error) {
      console.error(`✗ Error insertando: ${sol.asunto.substring(0, 60)}...`)
      console.error(error)
    }
  }

  console.log("\n✓ Proceso completado")
}

insertarSolicitudes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
