import { ShieldAlert, ShieldCheck } from "lucide-react";
import PanelShell from "@/components/PanelShell";
import { getStats } from "@/lib/stats";
import "./reportes.css";

// Geometría del anillo (viewBox 320 x 320, radio 138)
const RADIO = 138;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export default async function ReportesPage() {
  const stats = await getStats();

  const dentro = stats.resueltas - stats.incumplidas;
  const avance =
    stats.total > 0 ? Math.round((stats.resueltas / stats.total) * 100) : 0;

  // Segmentos del anillo: a tiempo, fuera de plazo, sin cerrar
  const segmentos = [
    { clase: "ring-ok", cantidad: dentro },
    { clase: "ring-bad", cantidad: stats.incumplidas },
    { clase: "ring-pending", cantidad: stats.pendientes },
  ].map((seg, i, lista) => {
    const largo =
      stats.total > 0 ? (seg.cantidad / stats.total) * CIRCUNFERENCIA : 0;
    const inicio = lista
      .slice(0, i)
      .reduce(
        (acc, s) =>
          acc + (stats.total > 0 ? (s.cantidad / stats.total) * CIRCUNFERENCIA : 0),
        0
      );
    return { ...seg, largo, inicio };
  });

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

      {stats.total === 0 && (
        <p className="rep-unit" role="status">
          Aún no hay solicitudes registradas. Las estadísticas aparecerán aquí
          cuando existan datos.
        </p>
      )}

      <section className="rep-grid" aria-label="Estadísticas de cumplimiento">
        {/* ---------- Columna izquierda ---------- */}
        <div className="rep-col">
          <article className="rep-card rep-card-dark">
            <div className="rep-card-head">
              <div>
                <p className="rep-eyebrow">CUMPLIMIENTO DEL SLA</p>
                <p className="rep-sub">dentro del plazo</p>
              </div>
              <div className="rep-icon rep-icon-dark">
                <ShieldCheck size={26} />
              </div>
            </div>
            <strong className="rep-value">
              {stats.cumplimiento === null ? "—" : `${stats.cumplimiento}%`}
            </strong>
            <span className="rep-unit">
              {dentro} de {stats.resueltas} solicitudes resueltas a tiempo
            </span>
          </article>

          <article className="rep-card rep-card-dashed">
            <div className="rep-card-head">
              <div>
                <p className="rep-eyebrow">INCUMPLIMIENTOS</p>
                <p className="rep-sub">fuera del plazo</p>
              </div>
              <div className="rep-icon rep-icon-red">
                <ShieldAlert size={26} />
              </div>
            </div>
            <strong className="rep-value rep-value-navy">
              {stats.incumplidas}
            </strong>
            <span className="rep-unit">solicitudes que superaron el SLA</span>
          </article>

          <article className="rep-card">
            <div className="rep-progress-head">
              <p className="rep-eyebrow">AVANCE DE SOLICITUDES</p>
              <span className="rep-progress-pct">{avance}%</span>
            </div>
            <div
              className="rep-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={avance}
              aria-label="Solicitudes resueltas"
            >
              <div className="rep-bar-fill" style={{ width: `${avance}%` }} />
              <span className="rep-bar-thumb" style={{ left: `${avance}%` }} />
            </div>
            <div className="rep-bar-scale">
              <span>0</span>
              <span>
                {stats.resueltas} de {stats.total} resueltas
              </span>
              <span>{stats.total}</span>
            </div>
          </article>
        </div>

        {/* ---------- Anillo ---------- */}
        <article className="rep-card rep-card-ring">
          <div className="rep-ring-head">
            <div>
              <p className="rep-eyebrow">ESTADO DE LAS SOLICITUDES</p>
              <p className="rep-sub">Distribución según el SLA</p>
            </div>
            <ul className="rep-legend">
              <li>
                <span className="dot dot-ok" />A tiempo ({dentro})
              </li>
              <li>
                <span className="dot dot-bad" />
                Fuera de plazo ({stats.incumplidas})
              </li>
              <li>
                <span className="dot dot-pending" />
                Sin cerrar ({stats.pendientes})
              </li>
            </ul>
          </div>

          <div className="rep-ring">
            <svg
              viewBox="0 0 320 320"
              role="img"
              aria-label={`${dentro} a tiempo, ${stats.incumplidas} fuera de plazo y ${stats.pendientes} sin cerrar de ${stats.total} solicitudes`}
            >
              <circle className="ring-track" cx="160" cy="160" r={RADIO} />
              {segmentos
                .filter((seg) => seg.cantidad > 0)
                .map((seg) => (
                  <circle
                    key={seg.clase}
                    className={seg.clase}
                    cx="160"
                    cy="160"
                    r={RADIO}
                    strokeDasharray={`${seg.largo} ${CIRCUNFERENCIA - seg.largo}`}
                    strokeDashoffset={-seg.inicio}
                  />
                ))}
            </svg>
            <div className="rep-ring-center">
              <strong>{stats.total}</strong>
              <span>SOLICITUDES</span>
            </div>
          </div>

          <p className="rep-ring-foot">
            {stats.incumplidas} FUERA DEL PLAZO
          </p>
        </article>
      </section>
    </PanelShell>
  );
}