import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      WITH Datos AS (
        SELECT
          TRY_CAST(LEFT(Numero, CHARINDEX('.', Numero + '.') - 1) AS INT) AS Principio,
          EstaPresente,
          EstaFuncionando
        FROM dbo.EvaluacionesPrincipioDetalleDGCI
      ),
      Componentes AS (
        SELECT
          CASE 
            WHEN Principio BETWEEN 1 AND 5 THEN 1
            WHEN Principio BETWEEN 6 AND 9 THEN 2
            WHEN Principio BETWEEN 10 AND 12 THEN 3
            WHEN Principio BETWEEN 13 AND 15 THEN 4
            WHEN Principio BETWEEN 16 AND 17 THEN 5
          END AS ComponenteId,
          COUNT(*) AS TotalPreguntas,
          SUM(CASE WHEN EstaPresente = 'SI' THEN 1 ELSE 0 END) AS TotalPresente,
          SUM(CASE WHEN EstaFuncionando = 'SI' THEN 1 ELSE 0 END) AS TotalFuncionando
        FROM Datos
        WHERE Principio BETWEEN 1 AND 17
        GROUP BY
          CASE 
            WHEN Principio BETWEEN 1 AND 5 THEN 1
            WHEN Principio BETWEEN 6 AND 9 THEN 2
            WHEN Principio BETWEEN 10 AND 12 THEN 3
            WHEN Principio BETWEEN 13 AND 15 THEN 4
            WHEN Principio BETWEEN 16 AND 17 THEN 5
          END
      )
      SELECT
        ComponenteId,
        TotalPreguntas,
        TotalPresente,
        TotalFuncionando,
        CAST(TotalPresente * 100.0 / NULLIF(TotalPreguntas, 0) AS DECIMAL(10,2)) AS PorcentajePresente,
        CAST(TotalFuncionando * 100.0 / NULLIF(TotalPreguntas, 0) AS DECIMAL(10,2)) AS PorcentajeFuncionando
      FROM Componentes
      ORDER BY ComponenteId;
    `);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}