"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface StatusStat {
  name: string
  elaborado: number
  aprobado: number
  implementado: number
  actualizado: number
  difundido: number
  total: number
}

interface ReportsChartsProps {
  subModuleStats: StatusStat[]
  componentStats: StatusStat[]
}

const COLORS = {
  elaborado: "hsl(215, 65%, 35%)",
  aprobado: "hsl(168, 55%, 40%)",
  implementado: "hsl(35, 85%, 55%)",
  actualizado: "hsl(260, 50%, 55%)",
  difundido: "hsl(0, 72%, 51%)",
}

export function ReportsCharts({ subModuleStats, componentStats }: ReportsChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      {subModuleStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avance por Sub-Modulo (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subModuleStats} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 15%, 88%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(215, 15%, 88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="elaborado" fill={COLORS.elaborado} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="aprobado" fill={COLORS.aprobado} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="implementado" fill={COLORS.implementado} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="actualizado" fill={COLORS.actualizado} radius={[0, 2, 2, 0]} />
                  <Bar dataKey="difundido" fill={COLORS.difundido} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {componentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avance por Componente (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={componentStats} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 15%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(215, 15%, 88%)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="elaborado" fill={COLORS.elaborado} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="aprobado" fill={COLORS.aprobado} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="implementado" fill={COLORS.implementado} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actualizado" fill={COLORS.actualizado} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="difundido" fill={COLORS.difundido} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {subModuleStats.length === 0 && componentStats.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay datos disponibles. Agregue documentos en los modulos para ver las estadisticas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
