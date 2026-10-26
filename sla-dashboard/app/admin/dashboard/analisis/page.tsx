import { AlertTriangle, BarChart3, CheckCircle2, Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/require-admin";

type Fila = {
  nombre: string;
  cantidad: number;
};

function etiqueta(valor: string | null | undefined, vacio: string) {
  if (!valor || !valor.trim()) return vacio;
  return valor.replace(/_/g, " ");
}

function aFilas(
  grupos: { clave: string | null; cantidad: number }[],
  vacio: string
): Fila[] {
  return grupos
    .map((grupo) => ({
      nombre: etiqueta(grupo.clave, vacio),
      cantidad: grupo.cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

function Distribucion({
  titulo,
  descripcion,
  filas,
  total,
  columna,
}: {
  titulo: string;
  descripcion: string;
  filas: Fila[];
  total: number;
  columna: string;
}) {
  return (
    <section className="dashboard-welcome">
      <h2 className="dashboard-welcome-title">{titulo}</h2>

      <p className="dashboard-welcome-description">{descripcion}</p>

      <hr className="dashboard-divider" />

      <div className="usuarios-tabla-contenedor">
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>{columna}</th>
              <th>Cantidad</th>
              <th>Porcentaje</th>
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => {
              const porcentaje =
                total > 0 ? (fila.cantidad / total) * 100 : 0;

              return (
                <tr key={fila.nombre}>
                  <td data-label={columna}>
                    <strong>{fila.nombre}</strong>
                  </td>

                  <td data-label="Cantidad">
                    {fila.cantidad.toLocaleString("es-CO")}
                  </td>

                  <td data-label="Porcentaje">
                    <div>{porcentaje.toFixed(1)}%</div>
                    <div className="admin-barra">
                      <span style={{ width: `${porcentaje}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {filas.length === 0 && (
              <tr>
                <td colSpan={3}>Aún no hay datos para analizar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AnalisisAdminPage() {
  await requireAdminPage();

  const ahora = new Date();

  const [
    total,
    respondidas,
    vencidas,
    promedioIA,
    porEstado,
    porSLA,
    porProceso,
    porEncargado,
    topClientes,
  ] = await Promise.all([
    prisma.solicitud.count(),
    prisma.solicitud.count({ where: { fechaRespuesta: { not: null } } }),
    prisma.solicitud.count({
      where: { fechaRespuesta: null, vencimientoSLA: { lt: ahora } },
    }),
    prisma.solicitud.aggregate({ _avg: { confianzaIA: true } }),
    prisma.solicitud.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.solicitud.groupBy({ by: ["estadoSLA"], _count: { _all: true } }),
    prisma.solicitud.groupBy({ by: ["tipoProceso"], _count: { _all: true } }),
    prisma.solicitud.groupBy({ by: ["encargado"], _count: { _all: true } }),
    prisma.cliente.findMany({
      orderBy: { solicitudes: { _count: "desc" } },
      take: 8,
      select: {
        id: true,
        nombre: true,
        _count: { select: { solicitudes: true } },
      },
    }),
  ]);

  const porcentajeRespondidas =
    total > 0 ? (respondidas / total) * 100 : 0;

  const confianza = promedioIA._avg.confianzaIA;
  const confianzaTexto =
    confianza === null
      ? "—"
      : `${(confianza <= 1 ? confianza * 100 : confianza).toFixed(1)}%`;

  const filasEstado = aFilas(
    porEstado.map((g) => ({ clave: g.estado, cantidad: g._count._all })),
    "Sin estado"
  );

  const filasSLA = aFilas(
    porSLA.map((g) => ({ clave: g.estadoSLA, cantidad: g._count._all })),
    "Sin definir"
  );

  const filasProceso = aFilas(
    porProceso.map((g) => ({ clave: g.tipoProceso, cantidad: g._count._all })),
    "Sin clasificar"
  );

  const filasEncargado = aFilas(
    porEncargado.map((g) => ({ clave: g.encargado, cantidad: g._count._all })),
    "Sin asignar"
  );

  const filasClientes: Fila[] = topClientes
    .filter((cliente) => cliente._count.solicitudes > 0)
    .map((cliente) => ({
      nombre: cliente.nombre,
      cantidad: cliente._count.solicitudes,
    }));

  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Análisis</h1>

          <p className="dashboard-subtitle">
            Resumen de la actividad y del cumplimiento del SLA.
          </p>

          <div className="dashboard-accent" />
        </div>
      </header>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Solicitudes totales</p>
            <div className="dashboard-stat-icon">
              <BarChart3 />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {total.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Registradas en la plataforma
          </p>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Respondidas</p>
            <div className="dashboard-stat-icon">
              <CheckCircle2 />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {porcentajeRespondidas.toFixed(1)}%
          </p>

          <p className="dashboard-stat-description">
            {respondidas.toLocaleString("es-CO")} con fecha de respuesta
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">SLA vencido</p>
            <div className="dashboard-stat-icon icon-red">
              <AlertTriangle />
            </div>
          </div>

          <p className="dashboard-stat-value">
            {vencidas.toLocaleString("es-CO")}
          </p>

          <p className="dashboard-stat-description">
            Sin respuesta y con el tiempo cumplido
          </p>
        </article>

        <article className="dashboard-stat-card stat-red">
          <div className="dashboard-stat-header">
            <p className="dashboard-stat-label">Confianza promedio IA</p>
            <div className="dashboard-stat-icon icon-red">
              <Sparkles />
            </div>
          </div>

          <p className="dashboard-stat-value">{confianzaTexto}</p>

          <p className="dashboard-stat-description">
            Clasificación automática de solicitudes
          </p>
        </article>
      </section>

      <div className="admin-secciones">
        <Distribucion
          titulo="Solicitudes por estado"
          descripcion="Cómo se reparten las solicitudes según su estado."
          filas={filasEstado}
          total={total}
          columna="Estado"
        />

        <Distribucion
          titulo="Estado del SLA"
          descripcion="Distribución según el estado del acuerdo de servicio."
          filas={filasSLA}
          total={total}
          columna="SLA"
        />

        <Distribucion
          titulo="Tipo de proceso"
          descripcion="Solicitudes agrupadas por tipo de proceso."
          filas={filasProceso}
          total={total}
          columna="Proceso"
        />

        <Distribucion
          titulo="Carga por encargado"
          descripcion="Solicitudes asignadas a cada responsable."
          filas={filasEncargado}
          total={total}
          columna="Encargado"
        />
      </div>

      <Distribucion
        titulo="Clientes con más solicitudes"
        descripcion="Los clientes que más escriben a la plataforma."
        filas={filasClientes}
        total={total}
        columna="Cliente"
      />
    </main>
  );
}