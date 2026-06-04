import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        CAST(LEFT(Numero, CHARINDEX('.', Numero) - 1) AS INT) AS Sistema,
        SUM(CASE WHEN EstaPresente = 'SI' THEN 1 ELSE 0 END) AS TotalPresente,
        SUM(CASE WHEN EstaFuncionando = 'SI' THEN 1 ELSE 0 END) AS TotalFuncionando
      FROM dbo.Matriz_SistemaAdministrativoDetalle
      GROUP BY CAST(LEFT(Numero, CHARINDEX('.', Numero) - 1) AS INT)
      ORDER BY Sistema
    `);

    console.log("AFIRMATIVAS:", result.recordset);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error("ERROR API AFIRMATIVAS:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}