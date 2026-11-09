import { Ticket } from "lucide-react";
import PanelShell from "@/components/PanelShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export default async function SolicitudesPage() {
  const ahora = new Date();

  const [solicitudes, total, pendientes, resueltas] = await Promise.all([
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
    prisma.solicitud.count({ where: { fechaRespuesta: null } }),
    prisma.solicitud.count({ where: { fechaRespuesta: { not: null } } }),
  ]);

  return (
    <PanelShell title="Solicitudes">
      <section className="sla-welcome">
        <div>
          <h2>Control de solicitudes</h2>
          <p>Consulta el estado y la trazabilidad de cada caso registrado.</p>
        </div>
        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      <section className="sla-metrics" aria-label="Resumen de solicitudes">
        <article className="sla-metric-card">
          <div className="sla-metric-icon blue">
            <Ticket size={25} />
          </div>
          <p>Total de solicitudes</p>
          <div className="sla-metric-value">
            <strong>{total.toLocaleString("es-CO")}</strong>
            <span>casos registrados</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon red">
            <Ticket size={25} />
          </div>
          <p>Pendientes</p>
          <div className="sla-metric-value">
            <strong>{pendientes.toLocaleString("es-CO")}</strong>
            <span>sin respuesta</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Ticket size={25} />
          </div>
          <p>Respondidas</p>
          <div className="sla-metric-value">
            <strong>{resueltas.toLocaleString("es-CO")}</strong>
            <span>con fecha de respuesta</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Listado de solicitudes</h3>
          <p>
            Se muestran las {LIMITE_FILAS.toLocaleString("es-CO")} más
            recientes, ordenadas por fecha de recibido.
          </p>
        </div>

        <div className="sla-tabla-wrap">
          <table className="sla-tabla">
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
              {solicitudes.map((s) => {
                const respondida = Boolean(s.fechaRespuesta);
                const vencida =
                  !respondida &&
                  s.vencimientoSLA !== null &&
                  s.vencimientoSLA < ahora;

                const claseSLA = vencida
                  ? "sla-badge-rojo"
                  : respondida
                    ? "sla-badge-verde"
                    : "sla-badge-azul";

                return (
                  <tr key={s.id}>
                    <td data-label="Asunto">
                      <strong>{s.asunto}</strong>
                    </td>
                    <td data-label="Cliente">
                      {s.cliente?.nombre || s.nombreCliente || "Sin cliente"}
                    </td>
                    <td data-label="Remitente">{s.remitente}</td>
                    <td data-label="Encargado">
                      {s.encargado || "Sin asignar"}
                    </td>
                    <td data-label="Recibido">
                      {formatearFecha(s.fechaRecibido)}
                    </td>
                    <td data-label="Vence">
                      {formatearFecha(s.vencimientoSLA)}
                    </td>
                    <td data-label="Estado">
                      <span className="sla-badge sla-badge-azul">
                        {etiqueta(s.estado, "Sin estado")}
                      </span>
                    </td>
                    <td data-label="SLA">
                      <span className={`sla-badge ${claseSLA}`}>
                        {etiqueta(s.estadoSLA, "Sin definir")}
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
    </PanelShell>
  );
}