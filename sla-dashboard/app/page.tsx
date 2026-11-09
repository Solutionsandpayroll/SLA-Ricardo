import {
  Ticket,
  Users,
  Clock3,
  ChartNoAxesCombined,
  Wallet,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { getServerSession } from "next-auth";

import PanelShell from "@/components/PanelShell";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import { authOptions } from "@/lib/auth";
import { getStats, type SlaStats } from "@/lib/stats";

// Evita que Next.js prerenderice la página en el build y congele las cifras
export const dynamic = "force-dynamic";

// true  = las cifras se ven aunque no haya sesión iniciada
// false = solo se ven cuando el usuario inició sesión
const MOSTRAR_SIN_SESION = true;

function formatDuracion(ms: number | null) {
  if (ms === null) return "—";

  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;

  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  let stats: SlaStats | null = null;

  if (session || MOSTRAR_SIN_SESION) {
    try {
      stats = await getStats();
    } catch (error) {
      console.error("Error cargando los indicadores:", error);
      stats = null;
    }
  }

  const total = stats ? stats.total.toLocaleString("es-CO") : "—";
  const pendientes = stats ? stats.pendientes.toLocaleString("es-CO") : "—";
  const promedio = stats ? formatDuracion(stats.tiempoPromedioMs) : "—";
  const cumplimiento =
    stats && stats.cumplimiento !== null ? `${stats.cumplimiento}%` : "—%";
  const incumplidasTexto = stats
    ? `${stats.incumplidas.toLocaleString("es-CO")} fuera del plazo`
    : "Indicador de cumplimiento";

  return (
    <PanelShell title="Panel de Control">
      {/* Resumen */}
      <section className="sla-welcome">
        <div>
          <h2>Resumen Operativo</h2>
          <p>
            Consulta el estado de las solicitudes y realiza seguimiento
            a los tiempos de respuesta.
          </p>
        </div>

        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      {/* Indicadores */}
      <section className="sla-metrics" aria-label="Indicadores SLA">
        <article className="sla-metric-card">
          <div className="sla-metric-icon blue">
            <ChartNoAxesCombined size={25} />
          </div>
          <p>Total de solicitudes</p>
          <div className="sla-metric-value">
            <strong>{total}</strong>
            <span>casos registrados</span>
          </div>
          <div className="sla-metric-footer">
            <span>Indicador general</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <span className="sla-card-badge">SLA</span>
          <div className="sla-metric-icon red">
            <Ticket size={25} />
          </div>
          <p>Solicitudes pendientes</p>
          <div className="sla-metric-value">
            <strong>{pendientes}</strong>
            <span>requieren atención</span>
          </div>
          <div className="sla-metric-footer">
            <span>Seguimiento operativo</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon blue">
            <Clock3 size={25} />
          </div>
          <p>Tiempo promedio de respuesta</p>
          <div className="sla-metric-value">
            <strong>{promedio}</strong>
            <span>tiempo promedio</span>
          </div>
          <div className="sla-metric-footer">
            <span>Indicador de oportunidad</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <ShieldCheck size={25} />
          </div>
          <p>Cumplimiento del SLA</p>
          <div className="sla-metric-value">
            <strong>{cumplimiento}</strong>
            <span>dentro del plazo</span>
          </div>
          <div className="sla-metric-footer">
            <span>{incumplidasTexto}</span>
          </div>
        </article>
      </section>

      {/* Panel de acceso: SOLO empleados (Microsoft) */}
      <section className="sla-access-panel" id="acceso">
        <div className="sla-access-header">
          <div className="sla-access-icon">
            <LockKeyhole size={26} />
          </div>
          <div>
            <h3>Acceso de empleados</h3>
            <p>
              Ingresa con tu cuenta corporativa de Microsoft para
              acceder a la plataforma de seguimiento SLA.
            </p>
          </div>
        </div>

        <div className="sla-access-body">
          <div className="sla-access-button">
            <MicrosoftLoginButton />
          </div>
        </div>

        <div className="sla-access-footer">
          <span className="sla-access-security">
            <ShieldCheck size={16} />
            Acceso seguro con tu cuenta corporativa
          </span>
          <span className="sla-access-hint">
            ¿Eres administrador? Usa «Iniciar sesión admin» en el menú
            lateral.
          </span>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Seguimiento centralizado</h3>
          <p>Todo el proceso en un solo lugar.</p>
        </div>

        <div className="sla-feature-grid">
          <article className="sla-feature">
            <div className="sla-feature-icon">
              <Ticket size={21} />
            </div>
            <div>
              <h4>Control de solicitudes</h4>
              <p>Consulta el estado y la trazabilidad de cada caso.</p>
            </div>
            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>

          <article className="sla-feature">
            <div className="sla-feature-icon">
              <Users size={21} />
            </div>
            <div>
              <h4>Responsables y clientes</h4>
              <p>Identifica quién gestiona cada solicitud.</p>
            </div>
            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>

          <article className="sla-feature">
            <div className="sla-feature-icon">
              <Wallet size={21} />
            </div>
            <div>
              <h4>Indicadores de gestión</h4>
              <p>Evalúa los tiempos y el cumplimiento de los acuerdos.</p>
            </div>
            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>
        </div>
      </section>
    </PanelShell>
  );
}