import { Building2, Globe2, Inbox, UserX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";

export default async function ClientesAdminPage() {
  await requireAdminPage();

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      dominio: true,
      pais: true,
      createdAt: true,
      _count: { select: { solicitudes: true } },
    },
  });

  const totalSolicitudes = clientes.reduce(
    (acumulado, cliente) => acumulado + cliente._count.solicitudes,
    0
  );

  const paises = new Set(
    clientes.map((cliente) => cliente.pais).filter(Boolean)
  ).size;

  const sinSolicitudes = clientes.filter(
    (cliente) => cliente._count.solicitudes === 0
  ).length;

  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Gestión de clientes</h1>

          <p className="dashboard-subtitle">
            Consulta los clientes registrados y la actividad de cada uno.
          </p>

          <div className="dashboard-accent" />
        </div>
      </header>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Clientes registrados</p>
            <div className="dashboard-stat-icon">
              <Building2 />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {clientes.length.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Total de clientes en la plataforma
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Solicitudes asociadas</p>
            <div className="dashboard-stat-icon icon-red">
              <Inbox />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {totalSolicitudes.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Correos vinculados a algún cliente
          </p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Países</p>
            <div className="dashboard-stat-icon">
              <Globe2 />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {paises.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Países distintos con clientes
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Sin solicitudes</p>
            <div className="dashboard-stat-icon icon-red">
              <UserX />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {sinSolicitudes.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Clientes que aún no han escrito
          </p>
        </article>
      </section>

      <section className="dashboard-welcome">
        <h2 className="dashboard-welcome-title">Clientes de la plataforma</h2>

        <p className="dashboard-welcome-description">
          Listado de clientes con su dominio de correo, país y cantidad de
          solicitudes registradas.
        </p>

        <hr className="dashboard-divider" />

        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Dominio</th>
                <th>País</th>
                <th>Solicitudes</th>
                <th>Registrado</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td data-label="Cliente">
                    <strong>{cliente.nombre}</strong>
                  </td>

                  <td data-label="Dominio">{cliente.dominio}</td>

                  <td data-label="País">{cliente.pais || "Sin país"}</td>

                  <td data-label="Solicitudes">
                    <span
                      className={`usuario-rol ${
                        cliente._count.solicitudes > 0
                          ? "usuario-rol-user"
                          : "usuario-rol-admin"
                      }`}
                    >
                      {cliente._count.solicitudes.toLocaleString("es-CO")}
                    </span>
                  </td>

                  <td data-label="Registrado">
                    {cliente.createdAt.toLocaleDateString("es-CO", {
                      timeZone: "America/Bogota",
                    })}
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay clientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}