import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PorComponentesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Por Componentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Seleccione un submódulo desde el menú lateral para gestionar los documentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestión por Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo contiene los submódulos de control interno organizados por componentes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}