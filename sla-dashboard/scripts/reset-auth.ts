import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAuth() {
  console.log('Limpiando tablas de autenticación...')
  
  await prisma.session.deleteMany()
  console.log('✓ Sesiones eliminadas')
  
  await prisma.account.deleteMany()
  console.log('✓ Cuentas eliminadas')
  
  await prisma.user.deleteMany()
  console.log('✓ Usuarios eliminados')
  
  await prisma.verificationToken.deleteMany()
  console.log('✓ Tokens de verificación eliminados')
  
  console.log('\n✓ Base de datos limpiada correctamente')
  console.log('Ahora puedes intentar iniciar sesión nuevamente')
}

resetAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
