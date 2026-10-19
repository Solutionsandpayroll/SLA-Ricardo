"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./solicitudes.css";
import "./solicitudes-equipo.css";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  FileText,
  Play,
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Users,
  Timer,
  Hourglass,
} from "lucide-react";

interface Solicitud {
  id: string;
  asunto: string;
  remitente: string;
  encargado: string | null;
  fechaRecibido: string;
  inicioConteoSLA: string | null;
  vencimientoSLA: string | null;
  fechaRespuesta: string | null;
  tiempoHabil: string | null;
  estadoSLA: string | null;
  estado: string;
  nombreCliente: string | null;
  paisCliente: string | null;
  tipoProceso: string | null;
  confianzaIA: number | null;
}

interface ResultadoProcesamiento {
  total: number;
  solicitudes: number;
  noSolicitudes: number;
  respondidos: number;
  pendientes: number;
  errores: number;
  descartadosDominio?: number;
}

type Alcance = "mias" | "equipo";

/* ---------- Utilidades ---------- */

function formatearFecha(fecha: string | null) {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

function formatearDuracion(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const minutos = Math.round(ms / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) return resto ? `${horas} h ${resto} min` : `${horas} h`;
  const dias = Math.floor(horas / 24);
  const hRest = horas % 24;
  return hRest ? `${dias} d ${hRest} h` : `${dias} d`;
}

function estaRespondida(s: Solicitud) {
  const e = s.estado.toLowerCase();
  return (
    !!s.fechaRespuesta ||
    e === "respondida" ||
    e === "respondido" ||
    e === "cerrada"
  );
}

function msEntre(desde: string | null, hasta: string | null) {
  if (!desde || !hasta) return null;
  const a = new Date(desde).getTime();
  const b = new Date(hasta).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return b - a;
}

function etiquetaEstadoSLA(estado: string | null) {
  switch (estado) {
    case "dentro_sla":
      return <Badge className="sol-badge sol-badge-ok">Dentro del SLA</Badge>;
    case "proximo_vencer":
      return (
        <Badge className="sol-badge sol-badge-aviso">Próximo a vencer</Badge>
      );
    case "vencido":
      return <Badge className="sol-badge sol-badge-vencido">Vencido</Badge>;
    default:
      return (
        <Badge className="sol-badge sol-badge-neutro">No verificable</Badge>
      );
  }
}

function etiquetaEstado(estado: string) {
  const n = estado.toLowerCase();
  if (n === "respondida" || n === "respondido") {
    return (
      <Badge className="sol-badge sol-badge-respondida">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Respondida
      </Badge>
    );
  }
  if (n === "cerrada") {
    return <Badge className="sol-badge sol-badge-cerrada">Cerrada</Badge>;
  }
  return (
    <Badge className="sol-badge sol-badge-gestion">
      <Clock className="mr-1 h-3 w-3" />
      En gestión
    </Badge>
  );
}

/* ---------- Página ---------- */

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [resultado, setResultado] = useState<ResultadoProcesamiento | null>(
    null
  );
  const [error, setError] = useState("");
  const [alcance, setAlcance] = useState<Alcance>("mias");
  const [filtroEncargado, setFiltroEncargado] = useState("todos");
  const [ahora, setAhora] = useState(() => Date.now());

  const esEquipo = alcance === "equipo";

  const cargarSolicitudes = useCallback(async () => {
    try {
      setError("");
      // "mias": solo las solicitudes del usuario con sesión iniciada.
      // "equipo": las de todos los usuarios guardadas en la base de datos.
      const url = esEquipo
        ? "/api/procesar-correos?alcance=equipo"
        : "/api/procesar-correos";
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "No se pudieron cargar las solicitudes."
        );
      }
      setSolicitudes(Array.isArray(data.solicitudes) ? data.solicitudes : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las solicitudes."
      );
    } finally {
      setCargando(false);
    }
  }, [esEquipo]);

  // Carga inicial y cada vez que cambia el alcance
  useEffect(() => {
    void cargarSolicitudes();
  }, [cargarSolicitudes]);

  // Refresco automático cada minuto + reloj para "hace X horas"
  useEffect(() => {
    const id = setInterval(() => {
      setAhora(Date.now());
      void cargarSolicitudes();
    }, 60_000);
    return () => clearInterval(id);
  }, [cargarSolicitudes]);

  const cambiarAlcance = (nuevo: Alcance) => {
    if (nuevo === alcance) return;
    setCargando(true);
    setSolicitudes([]);
    setFiltroEncargado("todos");
    setAlcance(nuevo);
  };

  const procesarCorreos = async () => {
    setProcesando(true);
    setResultado(null);
    setError("");
    try {
      const res = await fetch("/api/procesar-correos", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudieron procesar los correos.");
      }
      setResultado(data.resumen || data);
      await cargarSolicitudes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error procesando los correos."
      );
    } finally {
      setProcesando(false);
    }
  };

  /* ---------- Métricas ---------- */

  const encargados = useMemo(
    () =>
      Array.from(
        new Set(solicitudes.map((s) => s.encargado).filter(Boolean))
      ).sort() as string[],
    [solicitudes]
  );

  const visibles = useMemo(
    () =>
      !esEquipo || filtroEncargado === "todos"
        ? solicitudes
        : solicitudes.filter((s) => (s.encargado || "") === filtroEncargado),
    [solicitudes, filtroEncargado, esEquipo]
  );

  const metricas = useMemo(() => {
    const respondidas = visibles.filter(estaRespondida);
    const pendientes = visibles.filter((s) => !estaRespondida(s));

    const tiempos = respondidas
      .map((s) => msEntre(s.fechaRecibido, s.fechaRespuesta))
      .filter((v): v is number => v !== null && v >= 0);

    const promedio = tiempos.length
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : null;

    const vencidas = pendientes.filter((s) => s.estadoSLA === "vencido").length;

    const pendientesOrdenadas = pendientes
      .map((s) => ({
        s,
        espera: ahora - new Date(s.fechaRecibido).getTime(),
      }))
      .filter((x) => Number.isFinite(x.espera))
      .sort((a, b) => b.espera - a.espera);

    return {
      promedio,
      respondidas: respondidas.length,
      pendientes: pendientes.length,
      vencidas,
      pendientesOrdenadas,
    };
  }, [visibles, ahora]);

  // Resumen por encargado (siempre sobre todo el equipo cargado)
  const porEncargado = useMemo(() => {
    const mapa = new Map<
      string,
      { total: number; pendientes: number; tiempos: number[] }
    >();
    for (const s of solicitudes) {
      const nombre = s.encargado || "Sin asignar";
      const fila = mapa.get(nombre) ?? { total: 0, pendientes: 0, tiempos: [] };
      fila.total += 1;
      if (estaRespondida(s)) {
        const t = msEntre(s.fechaRecibido, s.fechaRespuesta);
        if (t !== null && t >= 0) fila.tiempos.push(t);
      } else {
        fila.pendientes += 1;
      }
      mapa.set(nombre, fila);
    }
    return Array.from(mapa.entries())
      .map(([nombre, f]) => ({
        nombre,
        total: f.total,
        pendientes: f.pendientes,
        promedio: f.tiempos.length
          ? f.tiempos.reduce((a, b) => a + b, 0) / f.tiempos.length
          : null,
      }))
      .sort((a, b) => b.pendientes - a.pendientes);
  }, [solicitudes]);

  return (
    <div className="sla-solicitudes">
      <header className="sol-header">
        <div className="sol-encabezado-texto">
          <h1 className="sol-titulo">Solicitudes</h1>
          <p className="sol-subtitulo">
            {esEquipo
              ? "Estado de las solicitudes de todo el equipo, en tiempo real."
              : "Estado de tus solicitudes, en tiempo real."}
          </p>
          <div className="sol-acento" />
        </div>

        <div className="sol-acciones">
          <select
            className="sol-select"
            value={alcance}
            onChange={(e) => cambiarAlcance(e.target.value as Alcance)}
            aria-label="Alcance de las solicitudes"
          >
            <option value="mias">Mis solicitudes</option>
            <option value="equipo">Todo el equipo</option>
          </select>

          {esEquipo && (
            <select
              className="sol-select"
              value={filtroEncargado}
              onChange={(e) => setFiltroEncargado(e.target.value)}
              aria-label="Filtrar por encargado"
            >
              <option value="todos">Todos los encargados</option>
              {encargados.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            className="sol-btn sol-btn-actualizar"
            onClick={() => void cargarSolicitudes()}
            disabled={cargando || procesando}
          >
            {cargando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>

          <Button
            className="sol-btn sol-btn-procesar"
            onClick={procesarCorreos}
            disabled={procesando || cargando}
          >
            {procesando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Procesar correos
              </>
            )}
          </Button>
        </div>
      </header>

      {error && (
        <Card className="sol-card sol-card-error">
          <CardContent className="sol-error">
            <AlertCircle className="sol-error-icon" />
            <div>
              <p className="sol-error-titulo">
                No fue posible completar la operación
              </p>
              <p className="sol-error-mensaje">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {!cargando && solicitudes.length > 0 && (
        <div className="sol-kpis">
          <div className="sol-kpi">
            <Timer className="sol-kpi-icono" />
            <p className="sol-kpi-valor">
              {metricas.promedio !== null
                ? formatearDuracion(metricas.promedio)
                : "-"}
            </p>
            <p className="sol-kpi-label">
              Tiempo promedio de respuesta
              {esEquipo && filtroEncargado !== "todos"
                ? ` (${filtroEncargado})`
                : ""}
            </p>
          </div>

          <div className="sol-kpi">
            <Hourglass className="sol-kpi-icono" />
            <p className="sol-kpi-valor sol-valor-naranja">
              {metricas.pendientes}
            </p>
            <p className="sol-kpi-label">Sin responder</p>
          </div>

          <div className="sol-kpi">
            <AlertCircle className="sol-kpi-icono" />
            <p className="sol-kpi-valor sol-valor-rojo">{metricas.vencidas}</p>
            <p className="sol-kpi-label">Pendientes con SLA vencido</p>
          </div>

          <div className="sol-kpi">
            <CheckCircle2 className="sol-kpi-icono" />
            <p className="sol-kpi-valor sol-valor-verde">
              {metricas.respondidas}
            </p>
            <p className="sol-kpi-label">Respondidas</p>
          </div>
        </div>
      )}

      {/* Pendientes por responder (lo más urgente primero) */}
      {!cargando && metricas.pendientesOrdenadas.length > 0 && (
        <Card className="sol-card">
          <CardHeader className="sol-card-header">
            <CardTitle className="sol-card-title">
              Esperando respuesta
            </CardTitle>
            <CardDescription className="sol-card-description">
              Ordenadas por tiempo de espera, de mayor a menor.
            </CardDescription>
          </CardHeader>
          <CardContent className="sol-card-content">
            <ul className="sol-alertas">
              {metricas.pendientesOrdenadas.slice(0, 10).map(({ s, espera }) => (
                <li key={s.id} className="sol-alerta">
                  {esEquipo && (
                    <span className="sol-alerta-quien">
                      {s.encargado || "Sin asignar"}
                    </span>
                  )}
                  <span className="sol-alerta-texto">
                    {s.nombreCliente || s.remitente} escribió{" "}
                    <strong>hace {formatearDuracion(espera)}</strong> y aún no
                    hay respuesta
                  </span>
                  {etiquetaEstadoSLA(s.estadoSLA)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resumen por encargado (solo en la vista del equipo) */}
      {esEquipo && !cargando && porEncargado.length > 0 && (
        <Card className="sol-card">
          <CardHeader className="sol-card-header">
            <CardTitle className="sol-card-title">
              <Users className="mr-2 inline h-4 w-4" />
              Rendimiento por encargado
            </CardTitle>
            <CardDescription className="sol-card-description">
              Cómo va cada persona del equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="sol-card-content">
            <div className="sol-tabla-contenedor">
              <table className="sol-tabla">
                <thead>
                  <tr>
                    <th>Encargado</th>
                    <th>Solicitudes</th>
                    <th>Sin responder</th>
                    <th>Tiempo promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {porEncargado.map((f) => (
                    <tr key={f.nombre}>
                      <td>{f.nombre}</td>
                      <td>{f.total}</td>
                      <td>{f.pendientes}</td>
                      <td>
                        {f.promedio !== null
                          ? formatearDuracion(f.promedio)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Card className="sol-card">
          <CardHeader className="sol-card-header">
            <CardTitle className="sol-card-title">
              Resultado del procesamiento
            </CardTitle>
            <CardDescription className="sol-card-description">
              Resumen de los correos analizados en tu buzón.
            </CardDescription>
          </CardHeader>
          <CardContent className="sol-card-content">
            <div className="sol-resumen">
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor">{resultado.total}</p>
                <p className="sol-resumen-label">Analizados</p>
              </div>
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-azul">
                  {resultado.solicitudes}
                </p>
                <p className="sol-resumen-label">Nuevas solicitudes</p>
              </div>
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-gris">
                  {resultado.noSolicitudes}
                </p>
                <p className="sol-resumen-label">No son solicitudes</p>
              </div>
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-verde">
                  {resultado.respondidos}
                </p>
                <p className="sol-resumen-label">Respondidos</p>
              </div>
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-naranja">
                  {resultado.pendientes}
                </p>
                <p className="sol-resumen-label">Pendientes</p>
              </div>
              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-rojo">
                  {resultado.errores}
                </p>
                <p className="sol-resumen-label">Errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla principal */}
      <Card className="sol-card">
        <CardHeader className="sol-card-header">
          <CardTitle className="sol-card-title">
            {esEquipo ? "Todas las solicitudes" : "Mis solicitudes"}
          </CardTitle>
          <CardDescription className="sol-card-description">
            {esEquipo
              ? "Visibles para todo el equipo. Se actualizan solas cada minuto."
              : "Solo las solicitudes de tu buzón. Se actualizan solas cada minuto."}
          </CardDescription>
        </CardHeader>

        <CardContent className="sol-card-content">
          {cargando ? (
            <div className="sol-vacio">
              <Loader2 className="sol-vacio-icono animate-spin" />
              <p className="sol-vacio-titulo">Cargando solicitudes...</p>
              <p className="sol-vacio-texto">
                Estamos consultando los registros disponibles.
              </p>
            </div>
          ) : visibles.length === 0 ? (
            <div className="sol-vacio">
              <FileText className="sol-vacio-icono" />
              <p className="sol-vacio-titulo">No hay solicitudes detectadas</p>
              <p className="sol-vacio-texto">
                Haz clic en “Procesar correos” para analizar tu buzón y
                consultar las solicitudes encontradas.
              </p>
            </div>
          ) : (
            <div className="sol-tabla-contenedor">
              <table className="sol-tabla">
                <thead>
                  <tr>
                    {esEquipo && <th>Encargado</th>}
                    <th>Cliente</th>
                    <th>Asunto</th>
                    <th>Fecha recepción</th>
                    <th>Inicio SLA</th>
                    <th>Vencimiento SLA</th>
                    <th>Fecha respuesta</th>
                    <th>Tiempo hábil</th>
                    <th>Estado SLA</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((sol) => (
                    <tr key={sol.id}>
                      {esEquipo && <td>{sol.encargado || "-"}</td>}
                      <td className="sol-cliente">
                        {sol.nombreCliente || "-"}
                      </td>
                      <td>
                        <span className="sol-asunto" title={sol.asunto}>
                          {sol.asunto}
                        </span>
                      </td>
                      <td className="sol-fecha">
                        {formatearFecha(sol.fechaRecibido)}
                      </td>
                      <td className="sol-fecha">
                        {formatearFecha(sol.inicioConteoSLA)}
                      </td>
                      <td className="sol-fecha">
                        {formatearFecha(sol.vencimientoSLA)}
                      </td>
                      <td className="sol-fecha">
                        {formatearFecha(sol.fechaRespuesta)}
                      </td>
                      <td className="sol-fecha">{sol.tiempoHabil || "-"}</td>
                      <td>{etiquetaEstadoSLA(sol.estadoSLA)}</td>
                      <td>{etiquetaEstado(sol.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && visibles.length > 0 && (
            <p className="sol-contador">
              Solicitudes mostradas: {visibles.length}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}