
import Link from "next/link";
import {
  Ticket,
  Clock3,
  ShieldCheck,
  ChartNoAxesCombined,
  ClipboardList,
  UserCog,
  Building2,
  ArrowUpRight,
  Settings2,
} from "lucide-react";

const indicadores = [
  {
    titulo: "Total de solicitudes",
    valor: "—",
    descripcion: "Casos registrados en la plataforma",
    icono: Ticket,
    color: "navy",
  },
  {
    titulo: "Solicitudes pendientes",
    valor: "—",
    descripcion: "Requieren atención",
    icono: Clock3,
    color: "red",
  },
  {
    titulo: "Clientes registrados",
    valor: "—",
    descripcion: "Clientes en la plataforma",
    icono: Building2,
    color: "navy",
  },
  {
    titulo: "Cumplimiento del SLA",
    valor: "—%",
    descripcion: "Dentro del tiempo establecido",
    icono: ShieldCheck,
    color: "green",
  },
];

const accesos = [
  {
    titulo: "Solicitudes",
    descripcion: "Consulta, supervisa y administra los casos registrados.",
    href: "/admin/dashboard/solicitudes",
    icono: Ticket,
    etiqueta: "GESTIÓN",
  },
  {
    titulo: "Análisis",
    descripcion: "Revisa tiempos de respuesta e indicadores del servicio.",
    href: "/admin/dashboard/analisis",
    icono: ChartNoAxesCombined,
    etiqueta: "INDICADORES",
  },
  {
    titulo: "Clientes",
    descripcion: "Consulta y gestiona la información de tus clientes.",
    href: "/admin/dashboard/clientes",
    icono: Building2,
    etiqueta: "DIRECTORIO",
  },
  {
    titulo: "Usuarios",
    descripcion: "Administra los accesos y roles de la plataforma.",
    href: "/admin/dashboard/usuarios",
    icono: UserCog,
    etiqueta: "ADMINISTRACIÓN",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="admin-home">
      <header className="admin-home-header">
        <div className="admin-home-heading">
          <div className="admin-home-eyebrow">
            <span className="admin-home-eyebrow-dot" />
            SOLUTIONS & PAYROLL
          </div>

          <h1 className="dashboard-title">
            Panel de Administración
          </h1>

          <p className="dashboard-subtitle">
            Bienvenido al centro de control. Supervisa las
            solicitudes, clientes y niveles de servicio
            desde un solo lugar.
          </p>
        </div>

        <div className="admin-home-header-icon">
          <Settings2 size={25} />
        </div>
      </header>

      <section className="admin-home-section">
        <div className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-kicker">
              RESUMEN GENERAL
            </span>
            <h2>Indicadores de gestión</h2>
            <p>Estado general de la operación</p>
          </div>
        </div>

        <div className="dashboard-stats">
          {indicadores.map((item) => {
            const Icon = item.icono;

            return (
              <article
                key={item.titulo}
                className={`dashboard-stat-card stat-${item.color}`}
              >
                <div className="dashboard-stat-header">
                  <span className="dashboard-stat-label">
                    {item.titulo}
                  </span>

                  <div className="dashboard-stat-icon">
                    <Icon size={21} />
                  </div>
                </div>

                <div className="dashboard-stat-value">
                  {item.valor}
                </div>

                <p className="dashboard-stat-description">
                  {item.descripcion}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-home-section admin-home-management">
        <div className="admin-home-section-heading">
          <div>
            <span className="admin-home-section-kicker">
              HERRAMIENTAS DEL SISTEMA
            </span>
            <h2>Gestión administrativa</h2>
            <p>
              Selecciona el módulo al que deseas acceder.
            </p>
          </div>
        </div>

        <div className="admin-links">
          {accesos.map((item) => {
            const Icon = item.icono;

            return (
              <Link
                href={item.href}
                key={item.titulo}
                className="admin-link-card"
              >
                <div className="admin-link-top">
                  <div className="admin-link-icon">
                    <Icon size={23} />
                  </div>

                  <ArrowUpRight
                    className="admin-link-arrow"
                    size={20}
                  />
                </div>

                <span className="admin-link-label">
                  {item.etiqueta}
                </span>

                <strong>{item.titulo}</strong>

                <span className="admin-link-description">
                  {item.descripcion}
                </span>

                <span className="admin-link-action">
                  Abrir módulo
                  <ArrowUpRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="admin-barra">
        <ClipboardList size={24} />

        <div>
          <strong>Centro de control administrativo</strong>
          <p>
            Desde este espacio puedes supervisar la operación,
            administrar los recursos y realizar seguimiento
            al cumplimiento de los acuerdos de servicio.
          </p>
        </div>
      </section>
    </div>
  );
}
