import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      WITH Detalle AS (
        SELECT
          TRY_CAST(LEFT(Numero, CHARINDEX('.', Numero + '.') - 1) AS INT) AS PrincipioNumero,
          TRY_CAST(Calificacion AS DECIMAL(10,2)) AS Calificacion
        FROM dbo.EvaluacionesPrincipioDetalleDGCI
      )
      SELECT
        p.PrincipioId,
        p.PrincipioTitulo,
        p.PreguntaGeneralNumero,
        p.PreguntaGeneralTexto,
        COUNT(d.Calificacion) AS TotalPreguntas,
        ISNULL(SUM(d.Calificacion), 0) AS SumaCalificacion,
        CAST(
          CASE 
            WHEN COUNT(d.Calificacion) = 0 THEN 0
            ELSE SUM(d.Calificacion) * 1.0 / COUNT(d.Calificacion)
          END 
        AS DECIMAL(10,2)) AS Promedio
      FROM dbo.EvaluacionesPrincipioDGCI p
      LEFT JOIN Detalle d
        ON d.PrincipioNumero = TRY_CAST(REPLACE(p.PreguntaGeneralNumero, '.', '') AS INT)
      GROUP BY
        p.PrincipioId,
        p.PrincipioTitulo,
        p.PreguntaGeneralNumero,
        p.PreguntaGeneralTexto
      ORDER BY
        TRY_CAST(REPLACE(p.PreguntaGeneralNumero, '.', '') AS INT);
    `);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("ERROR API PRINCIPIOS:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}