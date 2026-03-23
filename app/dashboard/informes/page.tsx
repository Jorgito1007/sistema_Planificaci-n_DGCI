/*import { createClient } from "@/lib/supabase_old/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsCharts } from "@/components/reports-charts"

const subModuleNames: Record<string, string> = {
  pei: "PEI",
  poa: "POA",
  presupuesto: "Presupuesto",
  organizacion: "Organizacion",
  personal: "Personal",
  abastecimiento: "Abastecimiento",
  contabilidad: "Contabilidad",
  tesoreria: "Tesoreria",
  endeudamiento: "Endeudamiento",
  "inversion-publica": "Inversion Publica",
  "defensa-juridica": "Defensa Juridica",
  "control-interno": "Control Interno",
  modernizacion: "Modernizacion",
}

interface StatusStat {
  name: string
  elaborado: number
  aprobado: number
  implementado: number
  actualizado: number
  difundido: number
  total: number
}

export default async function InformesPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from("documents")
    .select("*")

  const { data: componentDocs } = await supabase
    .from("component_documents")
    .select("*")

  // Calculate stats per sub-module
  const subModuleStats: StatusStat[] = Object.entries(subModuleNames).map(([key, name]) => {
    const docs = documents?.filter((d) => d.sub_module === key) || []
    const total = docs.length
    return {
      name,
      elaborado: total > 0 ? Math.round((docs.filter((d) => d.elaborado).length / total) * 100) : 0,
      aprobado: total > 0 ? Math.round((docs.filter((d) => d.aprobado).length / total) * 100) : 0,
      implementado: total > 0 ? Math.round((docs.filter((d) => d.implementado).length / total) * 100) : 0,
      actualizado: total > 0 ? Math.round((docs.filter((d) => d.actualizado).length / total) * 100) : 0,
      difundido: total > 0 ? Math.round((docs.filter((d) => d.difundido).length / total) * 100) : 0,
      total,
    }
  }).filter((s) => s.total > 0)

  // Calculate component stats
  const componentStats: StatusStat[] = [1, 2, 3, 4, 5].map((i) => {
    const key = `componente-${i}`
    const docs = componentDocs?.filter((d) => d.component === key) || []
    const total = docs.length
    return {
      name: `Componente ${i}`,
      elaborado: total > 0 ? Math.round((docs.filter((d) => d.elaborado).length / total) * 100) : 0,
      aprobado: total > 0 ? Math.round((docs.filter((d) => d.aprobado).length / total) * 100) : 0,
      implementado: total > 0 ? Math.round((docs.filter((d) => d.implementado).length / total) * 100) : 0,
      actualizado: total > 0 ? Math.round((docs.filter((d) => d.actualizado).length / total) * 100) : 0,
      difundido: total > 0 ? Math.round((docs.filter((d) => d.difundido).length / total) * 100) : 0,
      total,
    }
  }).filter((s) => s.total > 0)

  // Overall percentages
  const allDocs = [...(documents || []), ...(componentDocs || [])]
  const totalAll = allDocs.length
  const overallStats = {
    elaborado: totalAll > 0 ? Math.round((allDocs.filter((d) => d.elaborado).length / totalAll) * 100) : 0,
    aprobado: totalAll > 0 ? Math.round((allDocs.filter((d) => d.aprobado).length / totalAll) * 100) : 0,
    implementado: totalAll > 0 ? Math.round((allDocs.filter((d) => d.implementado).length / totalAll) * 100) : 0,
    actualizado: totalAll > 0 ? Math.round((allDocs.filter((d) => d.actualizado).length / totalAll) * 100) : 0,
    difundido: totalAll > 0 ? Math.round((allDocs.filter((d) => d.difundido).length / totalAll) * 100) : 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Informes y Estadisticas</h1>
        <p className="text-sm text-muted-foreground">Porcentaje de avance por modulo y componente</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(overallStats).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground capitalize">{key}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{value}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${value}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportsCharts subModuleStats={subModuleStats} componentStats={componentStats} />
    </div>
  )
}
*/