import { Clock3 } from "lucide-react";
import PanelShell from "@/components/PanelShell";

export default function TiemposPage() {
  return (
    <PanelShell title="Tiempos de respuesta">
      <section className="sla-welcome">
        <div>
          <h2>Tiempos de respuesta</h2>
          <p>Evalúa qué tan rápido se atienden y se resuelven las solicitudes.</p>
        </div>
        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      <section className="sla-metrics" aria-label="Indicadores de tiempo">
        <article className="sla-metric-card">
          <div className="sla-metric-icon blue">
            <Clock3 size={25} />
          </div>
          <p>Tiempo promedio de respuesta</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>tiempo promedio</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Clock3 size={25} />
          </div>
          <p>Tiempo promedio de resolución</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>hasta el cierre</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon red">
            <Clock3 size={25} />
          </div>
          <p>Fuera de plazo</p>
          <div className="sla-metric-value">
            <strong>—</strong>
            <span>solicitudes vencidas</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Detalle de tiempos</h3>
          <p>Aquí irá el detalle de tiempos por solicitud.</p>
        </div>
      </section>
    </PanelShell>
  );
}