import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prisma = new PrismaClient();

const terminal = createInterface({
  input: stdin,
  output: stdout,
});

async function main() {
  const email = (
    await terminal.question("Correo del administrador: ")
  )
    .trim()
    .toLowerCase();

  const password = await terminal.question(
    "Contraseña del administrador: "
  );

  if (!email || !password) {
    throw new Error("El correo y la contraseña son obligatorios.");
  }

  if (password.length < 12) {
    throw new Error(
      "Usa una contraseña de al menos 12 caracteres."
    );
  }

  const passwordHash = await hash(password, 12);

  const usuarioExistente = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  const administrador = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email,
      name: "Administrador",
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(
    usuarioExistente
      ? "Administrador actualizado correctamente."
      : "Administrador creado correctamente."
  );

  console.log("Correo:", administrador.email);
  console.log("Rol:", administrador.role);
}

main()
  .catch((error) => {
    console.error("No se pudo registrar el administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    terminal.close();
    await prisma.$disconnect();
  });