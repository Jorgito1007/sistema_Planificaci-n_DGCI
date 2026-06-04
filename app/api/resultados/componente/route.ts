import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        CASE 
          WHEN Principio BETWEEN 1 AND 5 THEN 1
          WHEN Principio BETWEEN 6 AND 9 THEN 2
          WHEN Principio BETWEEN 10 AND 12 THEN 3
          WHEN Principio BETWEEN 13 AND 15 THEN 4
          WHEN Principio BETWEEN 16 AND 17 THEN 5
        END AS ComponenteId,

        CASE 
          WHEN Principio BETWEEN 1 AND 5 THEN 'Entorno de Control'
          WHEN Principio BETWEEN 6 AND 9 THEN 'Evaluación de Riesgos'
          WHEN Principio BETWEEN 10 AND 12 THEN 'Actividades de Control'
          WHEN Principio BETWEEN 13 AND 15 THEN 'Información y comunicación'
          WHEN Principio BETWEEN 16 AND 17 THEN 'Supervisión - Monitoreo'
        END AS Componente,

        COUNT(*) AS TotalPreguntas,
        SUM(Calificacion) AS SumaCalificacion,
        CAST(SUM(Calificacion) * 1.0 / COUNT(*) AS DECIMAL(10,2)) AS Promedio

      FROM (
        SELECT 
          CAST(LEFT(Numero, CHARINDEX('.', Numero) - 1) AS INT) AS Principio,
          Calificacion
        FROM dbo.EvaluacionesPrincipioDetalleDGCI
      ) AS D

      GROUP BY
        CASE 
          WHEN Principio BETWEEN 1 AND 5 THEN 1
          WHEN Principio BETWEEN 6 AND 9 THEN 2
          WHEN Principio BETWEEN 10 AND 12 THEN 3
          WHEN Principio BETWEEN 13 AND 15 THEN 4
          WHEN Principio BETWEEN 16 AND 17 THEN 5
        END,
        CASE 
          WHEN Principio BETWEEN 1 AND 5 THEN 'Entorno de Control'
          WHEN Principio BETWEEN 6 AND 9 THEN 'Evaluación de Riesgos'
          WHEN Principio BETWEEN 10 AND 12 THEN 'Actividades de Control'
          WHEN Principio BETWEEN 13 AND 15 THEN 'Información y comunicación'
          WHEN Principio BETWEEN 16 AND 17 THEN 'Supervisión - Monitoreo'
        END

      ORDER BY ComponenteId;
    `);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}