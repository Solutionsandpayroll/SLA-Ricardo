import { Ticket } from "lucide-react";
import PanelShell from "@/components/PanelShell";

export default function SolicitudesPage() {
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
            <strong>—</strong>
            <span>casos registrados</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon red">
            <Ticket size={25} />
          </div>
          <p>Pendientes</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>requieren atención</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Ticket size={25} />
          </div>
          <p>Resueltas</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>cerradas</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Listado de solicitudes</h3>
          <p>Aquí irá la tabla con las solicitudes.</p>
        </div>
      </section>
    </PanelShell>
  );
}