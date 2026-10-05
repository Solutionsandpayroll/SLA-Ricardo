"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Filter, Play, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

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

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const cargarSolicitudes = async () => {
    const res = await fetch("/api/procesar-correos");
    const data = await res.json();
    setSolicitudes(data.solicitudes || []);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const procesarCorreos = async () => {
    setProcesando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/procesar-correos", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setResultado(data.resumen);
        await cargarSolicitudes();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Error procesando correos");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Solicitudes</h1>
          <p className="text-slate-600 mt-2">
            Gestión de solicitudes recibidas en los buzones
          </p>
        </div>
        <Button onClick={procesarCorreos} disabled={procesando}>
          {procesando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Procesar Correos
            </>
          )}
        </Button>
      </div>

      {resultado && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resultado del Procesamiento</CardTitle>
            <CardDescription>
              Correos analizados de los buzones configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{resultado.total}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{resultado.solicitudes}</p>
                <p className="text-sm text-slate-500">Solicitudes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-400">{resultado.noSolicitudes}</p>
                <p className="text-sm text-slate-500">No Solicitudes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{resultado.respondidos}</p>
                <p className="text-sm text-slate-500">Respondidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{resultado.pendientes}</p>
                <p className="text-sm text-slate-500">Pendientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{resultado.errores}</p>
                <p className="text-sm text-slate-500">Errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes Detectadas</CardTitle>
              <CardDescription>
                Correos clasificados como solicitudes por la IA
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">
                No hay solicitudes registradas
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Haz clic en "Procesar Correos" para analizar los buzones
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encargado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Fecha Recepción</TableHead>
                  <TableHead>Inicio SLA</TableHead>
                  <TableHead>Vencimiento SLA</TableHead>
                  <TableHead>Fecha Respuesta</TableHead>
                  <TableHead>Tiempo Hábil</TableHead>
                  <TableHead>Estado SLA</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((sol) => (
                  <TableRow key={sol.id}>
                    <TableCell className="text-sm text-slate-500">
                      {sol.encargado || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sol.nombreCliente || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {sol.asunto}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(sol.fechaRecibido).toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sol.inicioConteoSLA ? new Date(sol.inicioConteoSLA).toLocaleString("es-CO") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sol.vencimientoSLA ? new Date(sol.vencimientoSLA).toLocaleString("es-CO") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sol.fechaRespuesta ? new Date(sol.fechaRespuesta).toLocaleString("es-CO") : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sol.tiempoHabil || "-"}
                    </TableCell>
                    <TableCell>
                      {sol.estadoSLA === "dentro_sla" ? (
                        <Badge className="bg-green-100 text-green-800">
                          Dentro del SLA
                        </Badge>
                      ) : sol.estadoSLA === "proximo_vencer" ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Próximo a vencer
                        </Badge>
                      ) : sol.estadoSLA === "vencido" ? (
                        <Badge className="bg-red-100 text-red-800">
                          Vencido
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          No verificable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sol.estado === "respondida" ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Respondida
                        </Badge>
                      ) : sol.estado === "cerrada" ? (
                        <Badge className="bg-slate-100 text-slate-800">
                          Cerrada
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          En gestión
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
