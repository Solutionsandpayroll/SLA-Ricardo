import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function limpiarSolicitudes() {
  console.log("Eliminando todas las solicitudes...")
  
  const resultado = await prisma.solicitud.deleteMany()
  console.log(`✓ ${resultado.count} solicitudes eliminadas`)
  
  await prisma.$disconnect()
}

limpiarSolicitudes().catch(console.error)
