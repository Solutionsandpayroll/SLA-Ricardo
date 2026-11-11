
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

import PanelShell from "@/components/PanelShell";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";

export const dynamic = "force-dynamic";

export default function Home() {
  // Indicadores sin datos
  const indicadores = [
    {
      titulo: "Total de solicitudes",
      valor: "—",
      descripcion: "casos registrados",
      detalle: "Indicador general",
      icono: ChartNoAxesCombined,
      color: "blue",
    },
    {
      titulo: "Solicitudes pendientes",
      valor: "—",
      descripcion: "requieren atención",
      detalle: "Seguimiento operativo",
      icono: Ticket,
      color: "red",
    },
    {
      titulo: "Tiempo promedio de respuesta",
      valor: "—",
      descripcion: "tiempo promedio",
      detalle: "Indicador de oportunidad",
      icono: Clock3,
      color: "blue",
    },
    {
      titulo: "Cumplimiento del SLA",
      valor: "—",
      descripcion: "dentro del plazo",
      detalle: "Indicador de cumplimiento",
      icono: ShieldCheck,
      color: "green",
    },
  ];

  return (
    <PanelShell title="Panel de Control">

      {/* RESUMEN OPERATIVO */}
      <section className="sla-welcome">
        <div>
          <h2>Resumen Operativo</h2>
          <p>
            Métricas generales y estado de los procesos.
          </p>
        </div>

        <div className="sla-live-indicator">
          <span />
          Plataforma de seguimiento
        </div>
      </section>

      {/* INDICADORES */}
      <section
        className="sla-metrics"
        aria-label="Indicadores SLA"
      >
        {indicadores.map((indicador) => {
          const Icono = indicador.icono;

          return (
            <article
              className="sla-metric-card"
              key={indicador.titulo}
            >
              <div className={`sla-metric-icon ${indicador.color}`}>
                <Icono size={25} />
              </div>

              <p>{indicador.titulo}</p>

              <div className="sla-metric-value">
                <strong>{indicador.valor}</strong>
                <span>{indicador.descripcion}</span>
              </div>

              <div className="sla-metric-footer">
                <span>{indicador.detalle}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* ACCESO DE EMPLEADOS */}
      <section className="sla-access-panel" id="acceso">

        <div className="sla-access-header">
          <div className="sla-access-icon">
            <LockKeyhole size={26} />
          </div>

          <div>
            <h3>Acceso de empleados</h3>
            <p>
              Ingresa con tu cuenta corporativa de Microsoft
              para acceder a la plataforma de seguimiento SLA.
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
            ¿Eres administrador? Usa «Iniciar sesión admin»
            en el menú lateral.
          </span>
        </div>

      </section>

      {/* FUNCIONALIDADES */}
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
              <p>
                Consulta el estado y la trazabilidad de cada caso.
              </p>
            </div>

            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>

          <article className="sla-feature">
            <div className="sla-feature-icon">
              <Users size={21} />
            </div>

            <div>
              <h4>Responsables y clientes</h4>
              <p>
                Identifica quién gestiona cada solicitud.
              </p>
            </div>

            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>

          <article className="sla-feature">
            <div className="sla-feature-icon">
              <Wallet size={21} />
            </div>

            <div>
              <h4>Indicadores de gestión</h4>
              <p>
                Evalúa los tiempos y el cumplimiento de los acuerdos.
              </p>
            </div>

            <ArrowRight size={18} className="sla-feature-arrow" />
          </article>

        </div>
      </section>

    </PanelShell>
  );
}
