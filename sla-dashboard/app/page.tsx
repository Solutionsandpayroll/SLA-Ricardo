import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Clock3,
  ChartNoAxesCombined,
  Wallet,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import "./login.css";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Si ya inició sesión, enviar a cada usuario a su panel según el rol.
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "ADMIN" ? "/admin/solicitudes" : "/dashboard");
  }

  return (
    <main className="sla-home">
      {/* ============ BARRA LATERAL ============ */}
      <aside className="sla-sidebar">
        <div className="sla-brand">
          <Image
            src="/imagen.png"
            alt="Solutions & Payroll"
            width={280}
            height={120}
            priority
            className="sla-brand-logo"
          />
          <p>Seguimiento y control de solicitudes</p>
        </div>

        <nav className="sla-navigation" aria-label="Navegación principal">
          <span className="sla-nav-title">Menú</span>

          <Link href="#inicio" className="sla-nav-link active">
            <LayoutDashboard size={21} />
            <span>Inicio</span>
          </Link>

          <Link href="#solicitudes" className="sla-nav-link">
            <Ticket size={21} />
            <span>Solicitudes</span>
            <span className="sla-nav-badge">SLA</span>
          </Link>

          <Link href="#clientes" className="sla-nav-link">
            <Users size={21} />
            <span>Clientes</span>
          </Link>

          <Link href="#tiempos" className="sla-nav-link">
            <Clock3 size={21} />
            <span>Tiempos de respuesta</span>
          </Link>

          <Link href="#reportes" className="sla-nav-link">
            <ChartNoAxesCombined size={21} />
            <span>Reportes SLA</span>
          </Link>
        </nav>

        <div className="sla-sidebar-bottom">
          <div className="sla-session-status">
            <span className="sla-status-dot" />
            <span>Sesión: sin iniciar</span>
          </div>

          {/* Acceso del administrador (correo y contraseña) */}
          <Link href="/admin/login" className="sla-admin-link">
            <ShieldCheck size={20} />
            <span>Iniciar sesión admin</span>
            <ArrowRight size={16} className="sla-admin-link-arrow" />
          </Link>

          <div className="sla-sidebar-note">
            <BadgeCheck size={17} />
            <span>Acceso corporativo seguro</span>
          </div>
        </div>
      </aside>

      {/* ============ CONTENIDO PRINCIPAL ============ */}
      <section className="sla-main" id="inicio">
        <header className="sla-topbar">
          <div>
            <span className="sla-eyebrow">SOLUTIONS & PAYROLL</span>
            <h1>Panel de Control</h1>
          </div>

          <div className="sla-user">
            <div className="sla-user-icon">
              <UserRound size={22} />
            </div>
            <div>
              <strong>Invitado</strong>
              <span>Inicia sesión para continuar</span>
            </div>
          </div>
        </header>

        <div className="sla-content">
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
            <article className="sla-metric-card" id="solicitudes">
              <div className="sla-metric-icon blue">
                <ChartNoAxesCombined size={25} />
              </div>
              <p>Total de solicitudes</p>
              <div className="sla-metric-value">
                <strong>—</strong>
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
                <strong>—</strong>
                <span>requieren atención</span>
              </div>
              <div className="sla-metric-footer">
                <span>Seguimiento operativo</span>
              </div>
            </article>

            <article className="sla-metric-card" id="tiempos">
              <div className="sla-metric-icon blue">
                <Clock3 size={25} />
              </div>
              <p>Tiempo promedio de respuesta</p>
              <div className="sla-metric-value">
                <strong>—</strong>
                <span>tiempo promedio</span>
              </div>
              <div className="sla-metric-footer">
                <span>Indicador de oportunidad</span>
              </div>
            </article>

            <article className="sla-metric-card" id="reportes">
              <div className="sla-metric-icon green">
                <ShieldCheck size={25} />
              </div>
              <p>Cumplimiento del SLA</p>
              <div className="sla-metric-value">
                <strong>—%</strong>
                <span>dentro del plazo</span>
              </div>
              <div className="sla-metric-footer">
                <span>Indicador de cumplimiento</span>
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
          <section className="sla-features" id="clientes">
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

          <footer className="sla-footer">
            <span>Seguimiento SLA</span>
            <span>Solutions & Payroll · Gestión y control operativo</span>
          </footer>
        </div>
      </section>
    </main>
  );
}