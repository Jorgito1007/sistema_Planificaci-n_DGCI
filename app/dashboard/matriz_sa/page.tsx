import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SaMatrizPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Por Componentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Seleccione un submódulo desde el menú lateral para completar la Matriz del sistema administrativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestión del Sistema Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo contiene los submódulos de la matriz del sistema administrativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}