
"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  BarChart3,
  Clock3,
  FileText,
  Users,
  ChartNoAxesCombined,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

const COLORES = [
  "#102a43",
  "#d62839",
  "#173f5f",
  "#64748b",
  "#b45309",
  "#15803d",
  "#7c3aed",
  "#0891b2",
]

const TOOLTIP_STYLE = {
  borderRadius: "10px",
  border: "1px solid #e1e8f0",
  boxShadow: "0 4px 16px rgb(16 42 67 / 8%)",
  fontSize: "12px",
}

function Tarjeta({
  titulo,
  descripcion,
  hayDatos,
  children,
}: {
  titulo: string
  descripcion: string
  hayDatos: boolean
  children: React.ReactNode
}) {
  return (
    <Card className="analisis-card">
      <CardHeader className="analisis-card-header">
        <CardTitle className="analisis-card-title">
          {titulo}
        </CardTitle>

        <CardDescription className="analisis-card-description">
          {descripcion}
        </CardDescription>
      </CardHeader>

      <CardContent className="analisis-card-content">
        <div className="analisis-grafico">
          {hayDatos ? (
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          ) : (
            <div className="analisis-vacio">
              <BarChart3 className="analisis-vacio-icono" />

              <p className="analisis-vacio-titulo">
                Sin información disponible
              </p>

              <p className="analisis-vacio-texto">
                Aún no hay datos suficientes para mostrar este gráfico.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalisisCharts({
  total,
  porDia,
  porCliente,
  porTipo,
  tiempoPorDia,
  promedioHoras,
}: Props) {
  return (
    <main className="sla-analisis">

      {/* ENCABEZADO */}

      <header className="analisis-header">
        <div>
          <h1 className="analisis-titulo">
            Análisis
          </h1>

          <p className="analisis-subtitulo">
            Métricas y estadísticas del sistema · {total} solicitudes en los últimos 30 días
          </p>

          <div className="analisis-acento" />
        </div>
      </header>

      {/* INDICADORES */}

      <section className="analisis-kpis">

        <article className="analisis-kpi">
          <div className="analisis-kpi-icono">
            <FileText />
          </div>

          <p className="analisis-kpi-label">
            Solicitudes registradas
          </p>

          <p className="analisis-kpi-valor">
            {total}
          </p>

          <p className="analisis-kpi-descripcion">
            Últimos 30 días
          </p>
        </article>

        <article className="analisis-kpi">
          <div className="analisis-kpi-icono rojo">
            <Clock3 />
          </div>

          <p className="analisis-kpi-label">
            Tiempo promedio de respuesta
          </p>

          <p className="analisis-kpi-valor">
            {promedioHoras !== null ? `${promedioHoras} h` : "—"}
          </p>

          <p className="analisis-kpi-descripcion">
            Solicitudes respondidas
          </p>
        </article>

        <article className="analisis-kpi">
          <div className="analisis-kpi-icono">
            <Users />
          </div>

          <p className="analisis-kpi-label">
            Clientes identificados
          </p>

          <p className="analisis-kpi-valor">
            {porCliente.length}
          </p>

          <p className="analisis-kpi-descripcion">
            Clientes con solicitudes
          </p>
        </article>

        <article className="analisis-kpi">
          <div className="analisis-kpi-icono rojo">
            <ChartNoAxesCombined />
          </div>

          <p className="analisis-kpi-label">
            Tipos de proceso
          </p>

          <p className="analisis-kpi-valor">
            {porTipo.length}
          </p>

          <p className="analisis-kpi-descripcion">
            Categorías registradas
          </p>
        </article>

      </section>

      {/* GRÁFICOS */}

      <section className="analisis-graficos">

        <Tarjeta
          titulo="Solicitudes por día"
          descripcion="Volumen de solicitudes en los últimos 30 días"
          hayDatos={total > 0}
        >
          <BarChart data={porDia}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e1e8f0"
            />

            <XAxis
              dataKey="nombre"
              fontSize={11}
              interval={3}
              tick={{ fill: "#64748b" }}
              axisLine={{ stroke: "#e1e8f0" }}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              fontSize={11}
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip contentStyle={TOOLTIP_STYLE} />

            <Bar
              dataKey="valor"
              name="Solicitudes"
              fill="#102a43"
              radius={[5, 5, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </Tarjeta>

        <Tarjeta
          titulo="Solicitudes por cliente"
          descripcion="Distribución de solicitudes por cliente (top 8)"
          hayDatos={porCliente.length > 0}
        >
          <BarChart
            data={porCliente}
            layout="vertical"
            margin={{ left: 20, right: 15 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e1e8f0"
            />

            <XAxis
              type="number"
              allowDecimals={false}
              fontSize={11}
              tick={{ fill: "#64748b" }}
              axisLine={{ stroke: "#e1e8f0" }}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="nombre"
              width={110}
              fontSize={11}
              tick={{ fill: "#334155" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip contentStyle={TOOLTIP_STYLE} />

            <Bar
              dataKey="valor"
              name="Solicitudes"
              fill="#d62839"
              radius={[0, 5, 5, 0]}
              maxBarSize={25}
            />
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
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e1e8f0"
            />

            <XAxis
              dataKey="nombre"
              fontSize={11}
              tick={{ fill: "#64748b" }}
              axisLine={{ stroke: "#e1e8f0" }}
              tickLine={false}
            />

            <YAxis
              fontSize={11}
              unit=" h"
              tick={{ fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value} h`, "Tiempo"]}
            />

            <Line
              type="monotone"
              dataKey="valor"
              name="Horas"
              stroke="#d62839"
              strokeWidth={3}
              dot={{ r: 4, fill: "#d62839", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </Tarjeta>

        <Tarjeta
          titulo="Tipo de proceso"
          descripcion="Distribución por tipo de solicitud"
          hayDatos={porTipo.length > 0}
        >
          <PieChart>
            <Pie
              data={porTipo}
              dataKey="valor"
              nameKey="nombre"
              outerRadius={85}
              innerRadius={45}
              paddingAngle={3}
              label
            >
              {porTipo.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORES[i % COLORES.length]}
                />
              ))}
            </Pie>

            <Tooltip contentStyle={TOOLTIP_STYLE} />

            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: "11px" }}
            />
          </PieChart>
        </Tarjeta>

      </section>

    </main>
  )
}
