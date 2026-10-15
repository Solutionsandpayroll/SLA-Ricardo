"use client";

import { useCallback, useEffect, useState } from "react";
import "./solicitudes.css";

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

function etiquetaEstadoSLA(estado: string | null) {
  switch (estado) {
    case "dentro_sla":
      return (
        <Badge className="sol-badge sol-badge-ok">
          Dentro del SLA
        </Badge>
      );

    case "proximo_vencer":
      return (
        <Badge className="sol-badge sol-badge-aviso">
          Próximo a vencer
        </Badge>
      );

    case "vencido":
      return (
        <Badge className="sol-badge sol-badge-vencido">
          Vencido
        </Badge>
      );

    default:
      return (
        <Badge className="sol-badge sol-badge-neutro">
          No verificable
        </Badge>
      );
  }
}

function etiquetaEstado(estado: string) {
  const normalizado = estado.toLowerCase();

  if (
    normalizado === "respondida" ||
    normalizado === "respondido"
  ) {
    return (
      <Badge className="sol-badge sol-badge-respondida">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Respondida
      </Badge>
    );
  }

  if (normalizado === "cerrada") {
    return (
      <Badge className="sol-badge sol-badge-cerrada">
        Cerrada
      </Badge>
    );
  }

  return (
    <Badge className="sol-badge sol-badge-gestion">
      <Clock className="mr-1 h-3 w-3" />
      En gestión
    </Badge>
  );
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [resultado, setResultado] =
    useState<ResultadoProcesamiento | null>(null);

  const [error, setError] = useState("");

  const cargarSolicitudes = useCallback(async () => {
    try {
      setError("");

      const res = await fetch("/api/procesar-correos", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "No se pudieron cargar las solicitudes."
        );
      }

      setSolicitudes(
        Array.isArray(data.solicitudes) ? data.solicitudes : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar las solicitudes."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarSolicitudes();
  }, [cargarSolicitudes]);

  const procesarCorreos = async () => {
    setProcesando(true);
    setResultado(null);
    setError("");

    try {
      const res = await fetch("/api/procesar-correos", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "No se pudieron procesar los correos."
        );
      }

      setResultado(data.resumen || data);

      await cargarSolicitudes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error procesando los correos."
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="sla-solicitudes">
      {/* Encabezado */}
      <header className="sol-header">
        <div className="sol-encabezado-texto">
          <h1 className="sol-titulo">Solicitudes</h1>

          <p className="sol-subtitulo">
            Solicitudes detectadas en tu buzón de Microsoft.
          </p>

          <div className="sol-acento" />
        </div>

        <div className="sol-acciones">
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

      {/* Errores */}
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

      {/* Resultado del procesamiento */}
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
                <p className="sol-resumen-valor">
                  {resultado.total}
                </p>
                <p className="sol-resumen-label">Analizados</p>
              </div>

              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-azul">
                  {resultado.solicitudes}
                </p>
                <p className="sol-resumen-label">
                  Nuevas solicitudes
                </p>
              </div>

              <div className="sol-resumen-item">
                <p className="sol-resumen-valor sol-valor-gris">
                  {resultado.noSolicitudes}
                </p>
                <p className="sol-resumen-label">
                  No son solicitudes
                </p>
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
            Solicitudes detectadas
          </CardTitle>

          <CardDescription className="sol-card-description">
            Registros devueltos por la API para el usuario autenticado.
          </CardDescription>
        </CardHeader>

        <CardContent className="sol-card-content">
          {cargando ? (
            <div className="sol-vacio">
              <Loader2 className="sol-vacio-icono animate-spin" />

              <p className="sol-vacio-titulo">
                Cargando solicitudes...
              </p>

              <p className="sol-vacio-texto">
                Estamos consultando los registros disponibles.
              </p>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="sol-vacio">
              <FileText className="sol-vacio-icono" />

              <p className="sol-vacio-titulo">
                No hay solicitudes detectadas
              </p>

              <p className="sol-vacio-texto">
                Haz clic en “Procesar correos” para analizar tu buzón
                y consultar las solicitudes encontradas.
              </p>
            </div>
          ) : (
            <div className="sol-tabla-contenedor">
              <table className="sol-tabla">
                <thead>
                  <tr>
                    <th>Encargado</th>
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
                  {solicitudes.map((sol) => (
                    <tr key={sol.id}>
                      <td>{sol.encargado || "-"}</td>

                      <td className="sol-cliente">
                        {sol.nombreCliente || "-"}
                      </td>

                      <td>
                        <span
                          className="sol-asunto"
                          title={sol.asunto}
                        >
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

                      <td className="sol-fecha">
                        {sol.tiempoHabil || "-"}
                      </td>

                      <td>{etiquetaEstadoSLA(sol.estadoSLA)}</td>

                      <td>{etiquetaEstado(sol.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cargando && solicitudes.length > 0 && (
            <p className="sol-contador">
              Solicitudes mostradas: {solicitudes.length}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}