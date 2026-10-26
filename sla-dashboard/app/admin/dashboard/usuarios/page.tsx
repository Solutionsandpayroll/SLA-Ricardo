import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ShieldCheck, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { requireAdminPage } from "@/lib/require-admin";
import { Role } from "@prisma/client";

export default async function UsuariosAdminPage() {
  await requireAdminPage();

  const usuarios = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const totalAdministradores = usuarios.filter(
    (usuario) => usuario.role === Role.ADMIN
  ).length;

  async function cambiarRol(formData: FormData) {
    "use server";

    await requireAdminPage();

    const session = await getServerSession(authOptions);

    const usuarioId = formData.get("usuarioId");
    const nuevoRol = formData.get("role");

    if (
      typeof usuarioId !== "string" ||
      !usuarioId.trim() ||
      (nuevoRol !== Role.ADMIN && nuevoRol !== Role.USER)
    ) {
      throw new Error("Los datos enviados no son válidos.");
    }

    const usuarioObjetivo = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!usuarioObjetivo) {
      throw new Error("El usuario no existe.");
    }

    // Evitar que el administrador quite su propio rol.
    if (
      nuevoRol === Role.USER &&
      session?.user?.email &&
      usuarioObjetivo.email?.toLowerCase() ===
        session.user.email.toLowerCase()
    ) {
      throw new Error("No puedes quitarte tu propio rol de administrador.");
    }

    // No permitir que la plataforma se quede sin administradores.
    if (usuarioObjetivo.role === Role.ADMIN && nuevoRol === Role.USER) {
      const cantidadAdmins = await prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (cantidadAdmins <= 1) {
        throw new Error("Debe existir al menos un administrador.");
      }
    }

    await prisma.user.update({
      where: { id: usuarioId },
      data: { role: nuevoRol },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/usuarios");
  }

  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Gestión de usuarios</h1>

          <p className="dashboard-subtitle">
            Consulta los usuarios registrados y administra sus permisos.
          </p>

          <div className="dashboard-accent" />
        </div>
      </header>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Usuarios registrados</p>
            <div className="dashboard-stat-icon">
              <Users />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {usuarios.length.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Total de cuentas registradas
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Administradores</p>
            <div className="dashboard-stat-icon icon-red">
              <ShieldCheck />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {totalAdministradores.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Usuarios con permisos de administración
          </p>
        </article>
      </section>

      <section className="dashboard-welcome">
        <h2 className="dashboard-welcome-title">Usuarios de la plataforma</h2>

        <p className="dashboard-welcome-description">
          Puedes asignar o retirar el rol de administrador. Los cambios se
          guardan en la base de datos.
        </p>

        <hr className="dashboard-divider" />

        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo electrónico</th>
                <th>Rol actual</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <strong>{usuario.name || "Sin nombre"}</strong>
                  </td>

                  <td>{usuario.email || "Sin correo"}</td>

                  <td>
                    <span
                      className={`usuario-rol ${
                        usuario.role === Role.ADMIN
                          ? "usuario-rol-admin"
                          : "usuario-rol-user"
                      }`}
                    >
                      {usuario.role}
                    </span>
                  </td>

                  <td>
                    <form action={cambiarRol}>
                      <input
                        type="hidden"
                        name="usuarioId"
                        value={usuario.id}
                      />

                      <select
                        name="role"
                        defaultValue={usuario.role}
                        aria-label={`Cambiar rol de ${
                          usuario.name || usuario.email || "usuario"
                        }`}
                      >
                        <option value={Role.USER}>USER</option>
                        <option value={Role.ADMIN}>ADMIN</option>
                      </select>

                      <button type="submit" className="usuario-guardar">
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4}>No hay usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}