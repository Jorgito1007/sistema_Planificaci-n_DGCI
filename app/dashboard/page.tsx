import { getPool } from "@/lib/db";
import DashboardStatsClient from "./DashboardStatsClient";

type SubmoduloDocumento = {
  SubModuleId: number;
  SubModuleName: string;
  TotalDocumentos: number;
};

export default async function DashboardPage() {
  const pool = await getPool();

  const totalDocsResult = await pool.request().query(`
    SELECT COUNT(*) AS TotalDocumentos
    FROM dbo.Documentos_DGCI
  `);

  const totalDocs =
    totalDocsResult.recordset?.[0]?.TotalDocumentos ?? 0;

  const porSubmoduloResult = await pool.request().query(`
    SELECT
      s.SubModuleId,
      s.SubModuleName,
      COUNT(d.DocumentId) AS TotalDocumentos
    FROM dbo.submodulos_dgci s
    LEFT JOIN dbo.Documentos_DGCI d
      ON d.SubModuleId = s.SubModuleId
    WHERE s.IsActive = 1
      AND s.ModuleId = 1
    GROUP BY
      s.SubModuleId,
      s.SubModuleName,
      s.SortOrder
    ORDER BY
      s.SortOrder,
      s.SubModuleName
  `);

  const documentosPorSubmodulo: SubmoduloDocumento[] =
    porSubmoduloResult.recordset || [];

  const compCount = documentosPorSubmodulo.reduce(
    (acc, item) => acc + (item.TotalDocumentos || 0),
    0
  );

  const completedResult = await pool.request().query(`
    SELECT COUNT(*) AS TotalCompletados
    FROM dbo.Documentos_DGCI
    WHERE Elaborado = 1
      AND Aprobado = 1
      AND Implementado = 1
      AND Actualizado=1
      AND Difundido = 1
  `);

  const totalCompleted =
    completedResult.recordset?.[0]?.TotalCompletados ?? 0;

  const pendingResult = await pool.request().query(`
    SELECT COUNT(*) AS TotalPendientes
    FROM dbo.Documentos_DGCI
    WHERE ISNULL(Difundido, 0) = 0
  `);

  const pendingDocs =
    pendingResult.recordset?.[0]?.TotalPendientes ?? 0;

  const stats = [
    {
      title: "Total Documentos",
      value: totalDocs,
      description: "Documentos registrados",
      icon: "FileText",
      color: "bg-cyan-600 text-white",
      clickable: false,
    },
    {
      title: "Sistema Administrativo",
      value: compCount,
      description: "Documentos por sub-módulo",
      icon: "Layers",
      color: "bg-green-600 text-white",
      clickable: true,
    },
    {
      title: "Completados",
      value: totalCompleted,
      description: "Documentos Completados",
      icon: "CheckCircle2",
      color: "bg-yellow-400 text-black",
      clickable: false,
    },
    {
      title: "Pendientes",
      value: pendingDocs,
      description: "Documentos Pendientes",
      icon: "Clock",
      color: "bg-red-600 text-white",
      clickable: false,
    },
  ];

  return (
    <DashboardStatsClient
      stats={stats}
      documentosPorSubmodulo={documentosPorSubmodulo}
    />
  );
}