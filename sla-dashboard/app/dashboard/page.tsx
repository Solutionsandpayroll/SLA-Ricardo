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

import { prisma } from "@/lib/prisma";

// Evita que Next.js cachee la página y los números queden congelados
export const dynamic = "force-dynamic";

async function obtenerEstadisticas() {
  const [totalSolicitudes, nombresClientes, pendientes, respondidas] =
    await Promise.all([
      prisma.solicitud.count(),
      // Mismos criterios que la página de Clientes
      prisma.solicitud.findMany({
        where: { nombreCliente: { not: "" } },
        select: { nombreCliente: true },
      }),
      // Pendientes: solicitudes que aún no tienen fecha de respuesta
      prisma.solicitud.count({
        where: { fechaRespuesta: null },
      }),
      // Respondidas: se usan para calcular el cumplimiento del SLA
      prisma.solicitud.findMany({
        where: { fechaRespuesta: { not: null } },
        select: { fechaRespuesta: true, vencimientoSLA: true },
      }),
    ]);

  // Clientes únicos: misma agrupación que en /clientes
  // (nombre sin espacios sobrantes y sin distinguir mayúsculas/minúsculas)
  const clientesUnicos = new Set<string>();
  for (const { nombreCliente } of nombresClientes) {
    const nombre = nombreCliente?.trim();
    if (!nombre) continue;
    clientesUnicos.add(nombre.toLocaleLowerCase("es"));
  }
  const totalClientes = clientesUnicos.size;

  // SLA cumplido = respondidas a tiempo / total de respondidas
  const respondidasATiempo = respondidas.filter(
    (s) =>
      s.fechaRespuesta &&
      s.vencimientoSLA &&
      s.fechaRespuesta <= s.vencimientoSLA
  ).length;

  const slaCumplido =
    respondidas.length > 0
      ? Math.round((respondidasATiempo / respondidas.length) * 100)
      : 0;

  return { totalSolicitudes, totalClientes, pendientes, slaCumplido };
}

export default async function DashboardPage() {
  const { totalSolicitudes, totalClientes, pendientes, slaCumplido } =
    await obtenerEstadisticas();

  const estadisticas = [
    {
      titulo: "Total Solicitudes",
      valor: totalSolicitudes.toString(),
      descripcion: "Solicitudes registradas",
      icono: FileText,
      color: "blue",
    },
    {
      titulo: "Clientes",
      valor: totalClientes.toString(),
      descripcion: "Clientes registrados",
      icono: Users,
      color: "blue",
    },
    {
      titulo: "Pendientes",
      valor: pendientes.toString(),
      descripcion: "Solicitudes sin responder",
      icono: Clock,
      color: "red",
    },
    {
      titulo: "SLA Cumplido",
      valor: `${slaCumplido}%`,
      descripcion: "Tasa de cumplimiento",
      icono: TrendingUp,
      color: "blue",
    },
  ];

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
              <CardHeader className="dashboard-card-header">
                <div className="dashboard-stat-header">
                  <CardTitle className="dashboard-stat-label">
                    {estadistica.titulo}
                  </CardTitle>

                  <div
                    className={`dashboard-stat-icon ${
                      esRojo ? "icon-red" : ""
                    }`}
                  >
                    <Icono size={21} strokeWidth={2} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="dashboard-card-content">
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
          <CardHeader className="dashboard-welcome-header">
            <CardTitle className="dashboard-welcome-title">
              Bienvenido al SLA Dashboard
            </CardTitle>

            <CardDescription className="dashboard-welcome-description">
              Sistema de seguimiento de solicitudes y acuerdos
              de nivel de servicio para los buzones de correo.
            </CardDescription>
          </CardHeader>

          <CardContent className="dashboard-welcome-content">
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