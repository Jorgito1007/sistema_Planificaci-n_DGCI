/*import { createClient } from "@/lib/supabase_old/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AuditoriaPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("audit_log")
    .select(`
      id,
      action,
      table_name,
      record_id,
      details,
      created_at,
      user_id,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getTableBadge(tableName: string) {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      documents: "default",
      component_documents: "secondary",
      user_permissions: "outline",
      profiles: "destructive",
    }
    return colors[tableName] || "default"
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Registro de todas las acciones realizadas en el sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de Actividades</CardTitle>
          <CardDescription>Ultimas 100 acciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Fecha</TableHead>
                  <TableHead className="w-[180px]">Usuario</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead className="w-[150px]">Tabla</TableHead>
                  <TableHead className="w-[200px]">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!logs || logs.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay registros de auditoria disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const profile = log.profiles as { email: string; full_name: string } | null
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{profile?.full_name || profile?.email || "Sistema"}</span>
                        </TableCell>
                        <TableCell className="text-sm">{log.action}</TableCell>
                        <TableCell>
                          <Badge variant={getTableBadge(log.table_name)} className="text-xs">
                            {log.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
*/