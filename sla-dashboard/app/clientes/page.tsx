import { Users } from "lucide-react";
import PanelShell from "@/components/PanelShell";
import { prisma } from "@/lib/prisma";
import { obtenerClientesAgrupados } from "@/lib/clientes-agrupados";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, totalResponsables] = await Promise.all([
    obtenerClientesAgrupados(),
    prisma.responsableProceso.count({ where: { activo: true } }),
  ]);

  return (
    <PanelShell title="Clientes">
      <section className="sla-welcome">
        <div>
          <h2>Responsables y clientes</h2>
          <p>
            Identifica quién gestiona cada solicitud y a qué cliente pertenece.
          </p>
        </div>
        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      <section className="sla-metrics" aria-label="Resumen de clientes">
        <article className="sla-metric-card">
          <div className="sla-metric-icon blue">
            <Users size={25} />
          </div>
          <p>Total de clientes</p>
          <div className="sla-metric-value">
            <strong>{clientes.length.toLocaleString("es-CO")}</strong>
            <span>clientes registrados</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Users size={25} />
          </div>
          <p>Responsables</p>
          <div className="sla-metric-value">
            <strong>{totalResponsables.toLocaleString("es-CO")}</strong>
            <span>asignaciones activas</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Listado de clientes</h3>
          <p>Clientes registrados con su dominio, país y solicitudes.</p>
        </div>

        <div className="sla-tabla-wrap">
          <table className="sla-tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Dominio</th>
                <th>País</th>
                <th>Solicitudes</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td data-label="Cliente">
                    <strong>{c.nombre}</strong>
                  </td>
                  <td data-label="Dominio">{c.dominio || c.correo || "—"}</td>
                  <td data-label="País">{c.pais || "Sin país"}</td>
                  <td data-label="Solicitudes">
                    <span className="sla-badge sla-badge-azul">
                      {c.solicitudes.toLocaleString("es-CO")}
                    </span>
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4}>No hay clientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PanelShell>
  );
}