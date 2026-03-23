import { redirect } from "next/navigation";
import { DocumentTable } from "@/components/document-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPool } from "@/lib/db";

interface PageProps {
  params: Promise<{ submodule: string }>;
}

export default async function SubModulePage(props: PageProps) {
  const params = await props.params;
  const submodule = params.submodule;

  const pool = await getPool();

  // Buscar el submódulo por su key
  const subModuleResult = await pool
    .request()
    .input("SubModuleKey", submodule)
    .query(`
      SELECT 
        SubModuleId,
        SubModuleKey,
        SubModuleName
      FROM submodulos_dgci
      WHERE SubModuleKey = @SubModuleKey
        AND IsActive = 1
    `);

  const subModule = subModuleResult.recordset[0];

  if (!subModule) {
    redirect("/dashboard");
  }

  // Traer documentos del submódulo
  const documentsResult = await pool
    .request()
    .input("SubModuleId", subModule.SubModuleId)
    .query(`
      SELECT
        DocumentId,
        Nombre,
        SubModuleId,
        Elaborado,
        Aprobado,
        Implementado,
        Actualizado,
        Difundido,
        PdfUrl,
        CreatedAt,
        UpdatedAt
      FROM Documentos_DGCI
      WHERE SubModuleId = @SubModuleId
      ORDER BY CreatedAt ASC
    `);

  const documents = documentsResult.recordset;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Sistema Administrativo
        </h1>
        <p className="text-sm text-muted-foreground">
          Sub-módulo: {subModule.SubModuleName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {subModule.SubModuleName} - Documentos de Gestión
          </CardTitle>
        </CardHeader>

        <CardContent>
        <DocumentTable
  documents={documents}
  categoryValue={String(subModule.SubModuleId)}
/>
        </CardContent>
      </Card>
    </div>
  );
}