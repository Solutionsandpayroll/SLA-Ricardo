import { ShieldCheck } from "lucide-react";
import PanelShell from "@/components/PanelShell";

export default function ReportesPage() {
  return (
    <PanelShell title="Reportes SLA">
      <section className="sla-welcome">
        <div>
          <h2>Reportes de cumplimiento</h2>
          <p>Revisa el cumplimiento de los acuerdos de nivel de servicio.</p>
        </div>
        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      <section className="sla-metrics" aria-label="Indicadores de cumplimiento">
        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <ShieldCheck size={25} />
          </div>
          <p>Cumplimiento del SLA</p>
          <div className="sla-metric-value">
            <strong>—%</strong>
            <span>dentro del plazo</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon red">
            <ShieldCheck size={25} />
          </div>
          <p>Incumplimientos</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>fuera del plazo</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Reportes</h3>
          <p>Aquí irán los reportes y las opciones de descarga.</p>
        </div>
      </section>
    </PanelShell>
  );
}