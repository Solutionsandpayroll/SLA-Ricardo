import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Uso:
//   npx tsx scripts/create-admin.ts admin@tuempresa.com "TuContraseña" "Nombre opcional"
//
// Si el correo ya existe, le cambia la contraseña y lo deja como ADMIN.
async function main() {
  const [emailArg, password, ...nameParts] = process.argv.slice(2);

  if (!emailArg || !password) {
    console.error(
      'Faltan datos. Uso: npx tsx scripts/create-admin.ts correo "contraseña" "Nombre opcional"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const name = nameParts.join(" ").trim() || "Administrador";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });

  console.log(`Administrador listo: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });