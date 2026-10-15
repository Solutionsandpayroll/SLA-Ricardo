import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const clientes = ["Acme SAS", "Textiles del Sur", "Grupo Andino", "Logística Norte"]
const procesos = ["Nómina", "Seguridad Social", "Contratos", "Novedades"]

async function main() {
  // Modo borrar: npx tsx prisma/seed-demo.ts borrar
  if (process.argv[2] === "borrar") {
    const r = await prisma.solicitud.deleteMany({
      where: { messageId: { startsWith: "demo-" } },
    })
    console.log("Borradas", r.count, "solicitudes de prueba")
    return
  }

  // Usa el primer usuario que exista en tu base de datos
  const user = await prisma.user.findFirst()

  if (!user) {
    console.log("No hay usuarios. Inicia sesión una vez en la app y vuelve a intentar.")
    return
  }

  console.log("Usuario:", user.email, "(", user.id, ")")

  const filas = Array.from({ length: 40 }, (_, i) => {
    const recibido = new Date(Date.now() - Math.random() * 29 * 86400000)
    const respondida = Math.random() > 0.3
    const respuesta = respondida
      ? new Date(recibido.getTime() + (1 + Math.random() * 30) * 3600000)
      : null

    return {
      userId: user.id,
      messageId: `demo-${i}`,
      conversationId: `demo-conv-${i}`,
      asunto: `Solicitud de prueba ${i + 1}`,
      cuerpo: "Correo de prueba",
      remitente: "cliente@demo.com",
      correoCliente: "cliente@demo.com",
      nombreCliente: clientes[i % clientes.length],
      paisCliente: "Colombia",
      tipoProceso: procesos[Math.floor(Math.random() * procesos.length)],
      fechaRecibido: recibido,
      fechaRespuesta: respuesta,
      inicioConteoSLA: recibido,
      vencimientoSLA: new Date(recibido.getTime() + 48 * 3600000),
      tiempoHabil: "N/A",
      estadoSLA: "dentro_sla",
      estado: respondida ? "respondido" : "en_gestion",
    }
  })

  const r = await prisma.solicitud.createMany({ data: filas, skipDuplicates: true })
  console.log("Creadas", r.count, "solicitudes de prueba")
}

main().finally(() => prisma.$disconnect())