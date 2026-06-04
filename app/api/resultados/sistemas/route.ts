import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        CAST(LEFT(Numero, CHARINDEX('.', Numero) - 1) AS INT) AS Sistema,
        COUNT(*) AS TotalPreguntas,
        SUM(Calificacion) AS SumaCalificacion,
        CAST(SUM(Calificacion) * 1.0 / COUNT(*) AS DECIMAL(10,2)) AS Promedio
      FROM dbo.Matriz_SistemaAdministrativoDetalle
      GROUP BY CAST(LEFT(Numero, CHARINDEX('.', Numero) - 1) AS INT)
      ORDER BY Sistema
    `);

    console.log("RESULTADOS AGRUPADOS:", result.recordset);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("ERROR API RESULTADOS:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}