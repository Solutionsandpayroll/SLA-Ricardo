import { AlertTriangle, Clock, Inbox, MailQuestion } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";

const LIMITE_FILAS = 200;

function etiqueta(valor: string | null | undefined, vacio: string) {
  if (!valor || !valor.trim()) return vacio;
  return valor.replace(/_/g, " ");
}

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";

  return fecha.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

export default async function SolicitudesAdminPage() {
  await requireAdminPage();

  const ahora = new Date();

  const [solicitudes, total, enGestion, sinResponder, vencidas] =
    await Promise.all([
      prisma.solicitud.findMany({
        orderBy: { fechaRecibido: "desc" },
        take: LIMITE_FILAS,
        select: {
          id: true,
          asunto: true,
          remitente: true,
          encargado: true,
          fechaRecibido: true,
          vencimientoSLA: true,
          fechaRespuesta: true,
          estado: true,
          estadoSLA: true,
          nombreCliente: true,
          cliente: { select: { nombre: true } },
        },
      }),
      prisma.solicitud.count(),
      prisma.solicitud.count({ where: { estado: "en_gestion" } }),
      prisma.solicitud.count({ where: { fechaRespuesta: null } }),
      prisma.solicitud.count({
        where: {
          fechaRespuesta: null,
          vencimientoSLA: { lt: ahora },
        },
      }),
    ]);

  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Gestión de solicitudes</h1>

          <p className="dashboard-subtitle">
            Revisa los correos recibidos, su estado y el cumplimiento del SLA.
          </p>

          <div className="dashboard-accent" />
        </div>
      </header>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Solicitudes totales</p>
            <div className="dashboard-stat-icon">
              <Inbox />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {total.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Total de correos registrados
          </p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">En gestión</p>
            <div className="dashboard-stat-icon">
              <Clock />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {enGestion.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Solicitudes que se están atendiendo
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Sin responder</p>
            <div className="dashboard-stat-icon icon-red">
              <MailQuestion />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {sinResponder.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Aún no tienen fecha de respuesta
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">SLA vencido</p>
            <div className="dashboard-stat-icon icon-red">
              <AlertTriangle />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {vencidas.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Sin respuesta y con el tiempo cumplido
          </p>
        </article>
      </section>

      <section className="dashboard-welcome">
        <h2 className="dashboard-welcome-title">Solicitudes recibidas</h2>

        <p className="dashboard-welcome-description">
          Se muestran las solicitudes más recientes, ordenadas por fecha de
          recibido.
        </p>

        <hr className="dashboard-divider" />

        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>Cliente</th>
                <th>Remitente</th>
                <th>Encargado</th>
                <th>Recibido</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>SLA</th>
              </tr>
            </thead>

            <tbody>
              {solicitudes.map((solicitud) => {
                const respondida = Boolean(solicitud.fechaRespuesta);
                const vencida =
                  !respondida &&
                  solicitud.vencimientoSLA !== null &&
                  solicitud.vencimientoSLA < ahora;

                const claseSLA = vencida
                  ? "usuario-rol-admin"
                  : respondida
                    ? "usuario-rol-ok"
                    : "usuario-rol-user";

                return (
                  <tr key={solicitud.id}>
                    <td data-label="Asunto">
                      <strong>{solicitud.asunto}</strong>
                    </td>

                    <td data-label="Cliente">
                      {solicitud.cliente?.nombre ||
                        solicitud.nombreCliente ||
                        "Sin cliente"}
                    </td>

                    <td data-label="Remitente">{solicitud.remitente}</td>

                    <td data-label="Encargado">
                      {solicitud.encargado || "Sin asignar"}
                    </td>

                    <td data-label="Recibido">
                      {formatearFecha(solicitud.fechaRecibido)}
                    </td>

                    <td data-label="Vence">
                      {formatearFecha(solicitud.vencimientoSLA)}
                    </td>

                    <td data-label="Estado">
                      <span className="usuario-rol usuario-rol-user">
                        {etiqueta(solicitud.estado, "Sin estado")}
                      </span>
                    </td>

                    <td data-label="SLA">
                      <span className={`usuario-rol ${claseSLA}`}>
                        {etiqueta(solicitud.estadoSLA, "Sin definir")}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {solicitudes.length === 0 && (
                <tr>
                  <td colSpan={8}>No hay solicitudes registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > LIMITE_FILAS && (
          <p className="admin-nota">
            Mostrando las {LIMITE_FILAS.toLocaleString("es-CO")} solicitudes más
            recientes de {total.toLocaleString("es-CO")}.
          </p>
        )}
      </section>
    </main>
  );
}