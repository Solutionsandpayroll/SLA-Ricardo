"use client"

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { BarChart3 } from "lucide-react"

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"

interface Punto {
  nombre: string
  valor: number
}

interface Props {
  total: number
  porDia: Punto[]
  porCliente: Punto[]
  porTipo: Punto[]
  tiempoPorDia: Punto[]
  promedioHoras: number | null
}

const COLORES = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#64748b"]

function Tarjeta({
  titulo, descripcion, hayDatos, children,
}: {
  titulo: string
  descripcion: string
  hayDatos: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {hayDatos ? (
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <BarChart3 className="h-12 w-12" />
              <p className="text-sm text-slate-500">Aún no hay datos para este gráfico</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalisisCharts({
  total, porDia, porCliente, porTipo, tiempoPorDia, promedioHoras,
}: Props) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Análisis</h1>
        <p className="mt-2 text-slate-600">
          Métricas y estadísticas del sistema · {total} solicitudes en los últimos 30 días
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Tarjeta
          titulo="Solicitudes por día"
          descripcion="Volumen de solicitudes en los últimos 30 días"
          hayDatos={total > 0}
        >
          <BarChart data={porDia}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" fontSize={11} interval={3} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="valor" name="Solicitudes" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Tarjeta>

        <Tarjeta
          titulo="Solicitudes por cliente"
          descripcion="Distribución de solicitudes por cliente (top 8)"
          hayDatos={porCliente.length > 0}
        >
          <BarChart data={porCliente} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="nombre" width={110} fontSize={11} />
            <Tooltip />
            <Bar dataKey="valor" name="Solicitudes" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </Tarjeta>

        <Tarjeta
          titulo="Tiempo de respuesta promedio"
          descripcion={
            promedioHoras !== null
              ? `SLA de primera respuesta · promedio general: ${promedioHoras} h`
              : "SLA de primera respuesta"
          }
          hayDatos={tiempoPorDia.length > 0}
        >
          <LineChart data={tiempoPorDia}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" fontSize={11} />
            <YAxis fontSize={11} unit=" h" />
            <Tooltip />
            <Line type="monotone" dataKey="valor" name="Horas" stroke="#f59e0b" strokeWidth={2} dot />
          </LineChart>
        </Tarjeta>

        <Tarjeta
          titulo="Tipo de proceso"
          descripcion="Distribución por tipo de solicitud"
          hayDatos={porTipo.length > 0}
        >
          <PieChart>
            <Pie data={porTipo} dataKey="valor" nameKey="nombre" outerRadius={85} label>
              {porTipo.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Tarjeta>
      </div>
    </div>
  )
}