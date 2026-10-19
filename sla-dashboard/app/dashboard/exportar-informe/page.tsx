"use client";

import "../dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { SolicitudSLA } from "@/lib/exportarInformeSLA";
import { mapearSolicitud, type SolicitudApi } from "@/lib/mapearSolicitud";

const aFechaInput = (d: Date) => d.toISOString().slice(0, 10);

export default function Page() {
  const [solicitudes, setSolicitudes] = useState<SolicitudSLA[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cliente, setCliente] = useState("todos");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await fetch("/api/informe-sla");
        if (!res.ok) throw new Error("No se pudieron cargar las solicitudes");
        const data: { solicitudes: SolicitudApi[] } = await res.json();
        if (activo) setSolicitudes(data.solicitudes.map(mapearSolicitud));
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const clientes = useMemo(
    () => Array.from(new Set(solicitudes.map((s) => s.cliente).filter(Boolean))).sort(),
    [solicitudes]
  );

  const filtradas = useMemo(
    () =>
      solicitudes.filter((s) => {
        if (cliente !== "todos" && s.cliente !== cliente) return false;
        if (desde && aFechaInput(s.fechaRecepcion) < desde) return false;
        if (hasta && aFechaInput(s.fechaRecepcion) > hasta) return false;
        return true;
      }),
    [solicitudes, cliente, desde, hasta]
  );

  async function exportar() {
    setGenerando(true);
    try {
      // Se carga ExcelJS solo al exportar, para no pesar en el resto del dashboard
      const { generarInformeSLA, descargarBlob, nombreArchivoInforme } = await import(
        "@/lib/exportarInformeSLA"
      );
      const blob = await generarInformeSLA({
        solicitudes: filtradas,
        correcciones: [],
        corte: new Date(),
        nota: "",
        accionesPrioritarias: [],
        festivos: "",
      });
      descargarBlob(blob, nombreArchivoInforme());
    } finally {
      setGenerando(false);
    }
  }

  return (
    <main className="sla-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Exportar informe</h1>
          <p className="dashboard-subtitle">
            Genera el informe de seguimiento SLA en Excel con los datos actuales del sistema
          </p>
          <div className="dashboard-accent" />
        </div>
      </header>

      <section aria-label="Filtros del informe">
        <Card className="dashboard-welcome">
          <CardHeader className="p-0">
            <CardTitle className="dashboard-welcome-title">Filtros</CardTitle>
            <CardDescription className="dashboard-welcome-description">
              Opcional: acota el informe por cliente o por fecha de recepción.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="dashboard-divider" />
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "grid", gap: 4 }}>
                Cliente
                <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
                  <option value="todos">Todos</option>
                  {clientes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Desde
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Hasta
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </label>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Descarga" style={{ marginTop: 24 }}>
        <Card className="dashboard-welcome">
          <CardHeader className="p-0">
            <CardTitle className="dashboard-welcome-title">
              <FileSpreadsheet size={20} style={{ display: "inline", marginRight: 8 }} />
              Informe de seguimiento SLA
            </CardTitle>
            <CardDescription className="dashboard-welcome-description">
              {cargando
                ? "Cargando solicitudes…"
                : error
                ? error
                : `${filtradas.length} solicitud(es) incluidas. El archivo trae 4 hojas: Seguimiento SLA, Resumen ejecutivo, Criterios SLA y Registro de corrección.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="dashboard-divider" />
            <Button onClick={exportar} disabled={cargando || generando || filtradas.length === 0}>
              {generando ? (
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} />
              ) : (
                <Download size={16} style={{ marginRight: 8 }} />
              )}
              {generando ? "Generando…" : "Descargar Excel"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}