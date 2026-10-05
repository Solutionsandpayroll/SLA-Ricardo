import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalisisPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Análisis</h1>
        <p className="text-slate-600 mt-2">Métricas y estadísticas del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por día</CardTitle>
            <CardDescription>Volumen de solicitudes en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-16 h-16" />
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Los gráficos se mostrarán cuando haya datos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por cliente</CardTitle>
            <CardDescription>Distribución de solicitudes por cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-16 h-16" />
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Los gráficos se mostrarán cuando haya datos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiempo de respuesta promedio</CardTitle>
            <CardDescription>SLA de primera respuesta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-16 h-16" />
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Los gráficos se mostrarán cuando haya datos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de proceso</CardTitle>
            <CardDescription>Distribución por tipo de solicitud</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <BarChart3 className="w-16 h-16" />
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Los gráficos se mostrarán cuando haya datos disponibles
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
