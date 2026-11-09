import { Clock3 } from "lucide-react";
import PanelShell from "@/components/PanelShell";
import { prisma } from "@/lib/prisma";

const LIMITE_FILAS = 200;

function etiqueta(valor: string | null | undefined, vacio: string) {
  if (!valor || !valor.trim()) return vacio;
  return valor.replace(/_/g, " ");
}

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return fecha.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatearDuracion(ms: number | null) {
  if (ms === null || Number.isNaN(ms)) return "—";
  const minutos = Math.max(0, Math.round(ms / 60000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h ${minutos % 60} min`;
  const dias = Math.floor(horas / 24);
  return `${dias} d ${horas % 24} h`;
}

export default async function TiemposPage() {
  const ahora = new Date();

  const [respondidas, totalRespondidas, vencidas] = await Promise.all([
    prisma.solicitud.findMany({
      where: { fechaRespuesta: { not: null } },
      orderBy: { fechaRecibido: "desc" },
      take: LIMITE_FILAS,
      select: {
        id: true,
        asunto: true,
        remitente: true,
        fechaRecibido: true,
        inicioConteoSLA: true,
        fechaRespuesta: true,
        tiempoHabil: true,
        estadoSLA: true,
      },
    }),
    prisma.solicitud.count({ where: { fechaRespuesta: { not: null } } }),
    prisma.solicitud.count({
      where: { fechaRespuesta: null, vencimientoSLA: { lt: ahora } },
    }),
  ]);

  const duraciones = respondidas.flatMap((s) => {
    if (!s.fechaRespuesta) return [];
    const inicio = s.inicioConteoSLA ?? s.fechaRecibido;
    return [{ ...s, ms: s.fechaRespuesta.getTime() - inicio.getTime() }];
  });

  const promedio =
    duraciones.length > 0
      ? duraciones.reduce((acc, d) => acc + d.ms, 0) / duraciones.length
      : null;

  return (
    <PanelShell title="Tiempos de respuesta">
      <section className="sla-welcome">
        <div>
          <h2>Tiempos de respuesta</h2>
          <p>
            Evalúa qué tan rápido se atienden y se resuelven las solicitudes.
          </p>
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
            <strong>{formatearDuracion(promedio)}</strong>
            <span>tiempo calendario (últimas {LIMITE_FILAS})</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon green">
            <Clock3 size={25} />
          </div>
          <p>Solicitudes respondidas</p>
          <div className="sla-metric-value">
            <strong>{totalRespondidas.toLocaleString("es-CO")}</strong>
            <span>con fecha de respuesta</span>
          </div>
        </article>

        <article className="sla-metric-card">
          <div className="sla-metric-icon red">
            <Clock3 size={25} />
          </div>
          <p>Fuera de plazo</p>
          <div className="sla-metric-value">
            <strong>{vencidas.toLocaleString("es-CO")}</strong>
            <span>sin respuesta y vencidas</span>
          </div>
        </article>
      </section>

      <section className="sla-features">
        <div className="sla-section-heading">
          <h3>Detalle de tiempos</h3>
          <p>Tiempo entre el inicio del conteo y la respuesta de cada solicitud.</p>
        </div>

        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>Remitente</th>
                <th>Recibido</th>
                <th>Respondido</th>
                <th>Tiempo hábil</th>
                <th>SLA</th>
              </tr>
            </thead>

            <tbody>
              {duraciones.map((s) => (
                <tr key={s.id}>
                  <td data-label="Asunto">
                    <strong>{s.asunto}</strong>
                  </td>
                  <td data-label="Remitente">{s.remitente}</td>
                  <td data-label="Recibido">
                    {formatearFecha(s.fechaRecibido)}
                  </td>
                  <td data-label="Respondido">
                    {formatearFecha(s.fechaRespuesta)}
                  </td>
                  <td data-label="Tiempo hábil">
                    {s.tiempoHabil || formatearDuracion(s.ms)}
                  </td>
                  <td data-label="SLA">
                    <span className="usuario-rol usuario-rol-user">
                      {etiqueta(s.estadoSLA, "Sin definir")}
                    </span>
                  </td>
                </tr>
              ))}

              {duraciones.length === 0 && (
                <tr>
                  <td colSpan={6}>Aún no hay solicitudes respondidas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PanelShell>
  );
}