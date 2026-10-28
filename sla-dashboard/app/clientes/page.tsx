import { Users } from "lucide-react";
import PanelShell from "@/components/PanelShell";

export default function ClientesPage() {
  return (
    <PanelShell title="Clientes">
      <section className="sla-welcome">
        <div>
          <h2>Responsables y clientes</h2>
          <p>Identifica quién gestiona cada solicitud y a qué cliente pertenece.</p>
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
            <strong>—</strong>
            <span>clientes activos</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Users size={25} />
          </div>
          <p>Responsables</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>gestionando casos</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Listado de clientes</h3>
          <p>Aquí irá la tabla con los clientes y sus responsables.</p>
        </div>
      </section>
    </PanelShell>
  );
}