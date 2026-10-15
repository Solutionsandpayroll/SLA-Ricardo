import "./dashboard.css";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  FileText,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

const estadisticas = [
  {
    titulo: "Total Solicitudes",
    valor: "0",
    descripcion: "Solicitudes registradas",
    icono: FileText,
    color: "blue",
  },
  {
    titulo: "Clientes",
    valor: "0",
    descripcion: "Clientes registrados",
    icono: Users,
    color: "blue",
  },
  {
    titulo: "Pendientes",
    valor: "0",
    descripcion: "Solicitudes sin responder",
    icono: Clock,
    color: "red",
  },
  {
    titulo: "SLA Cumplido",
    valor: "0%",
    descripcion: "Tasa de cumplimiento",
    icono: TrendingUp,
    color: "blue",
  },
];

export default function DashboardPage() {
  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>

          <p className="dashboard-subtitle">
            Resumen general del sistema de seguimiento SLA
          </p>

          <div className="dashboard-accent" />
        </div>
      </header>

      <section
        className="dashboard-stats"
        aria-label="Indicadores generales"
      >
        {estadisticas.map((estadistica) => {
          const Icono = estadistica.icono;
          const esRojo = estadistica.color === "red";

          return (
            <Card
              key={estadistica.titulo}
              className={`dashboard-stat-card ${
                esRojo ? "stat-red" : ""
              }`}
            >
              <CardHeader className="p-0">
                <div className="dashboard-stat-header">
                  <CardTitle className="dashboard-stat-label">
                    {estadistica.titulo}
                  </CardTitle>

                  <div
                    className={`dashboard-stat-icon ${
                      esRojo ? "icon-red" : ""
                    }`}
                  >
                    <Icono size={21} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="dashboard-stat-value">
                  {estadistica.valor}
                </div>

                <p className="dashboard-stat-description">
                  {estadistica.descripcion}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section aria-label="Información del sistema">
        <Card className="dashboard-welcome">
          <CardHeader className="p-0">
            <CardTitle className="dashboard-welcome-title">
              Bienvenido al SLA Dashboard
            </CardTitle>

            <CardDescription className="dashboard-welcome-description">
              Sistema de seguimiento de solicitudes y acuerdos
              de nivel de servicio para los buzones de correo.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="dashboard-divider" />

            <p className="dashboard-welcome-description">
              Gestiona y monitorea las solicitudes recibidas por
              correo electrónico, clasifícalas automáticamente con
              inteligencia artificial y realiza seguimiento a los
              tiempos de respuesta para controlar el cumplimiento
              de los SLA.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}