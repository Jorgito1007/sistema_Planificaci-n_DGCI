"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersPermissionsUI } from "@/components/users-permissions-ui";

export default function PermisosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Permisos de Usuario</h1>
        <p className="text-sm text-muted-foreground">
          Gestione los usuarios del sistema y sus permisos de acceso a cada módulo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersPermissionsUI />
        </CardContent>
      </Card>
    </div>
  );
}