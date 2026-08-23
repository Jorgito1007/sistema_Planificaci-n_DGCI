import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        Id,
        Titulo,
        Mensaje,
        Tipo,
        CONVERT(VARCHAR(19), FechaInicio, 120) AS FechaInicio,
        CONVERT(VARCHAR(19), FechaFin, 120) AS FechaFin,
        CONVERT(VARCHAR(19), FechaActualizacion, 120) AS FechaActualizacion
      FROM dbo.AvisosSistema
      WHERE Activo = 1
        AND FechaInicio <= DATEADD(HOUR, -6, GETUTCDATE())
        AND FechaFin >= DATEADD(HOUR, -6, GETUTCDATE())
      ORDER BY FechaInicio DESC
    `);

    return NextResponse.json({
      ok: true,
      avisos: result.recordset,
    });

  } catch (error: any) {

    console.error("ERROR API AVISOS ACTIVOS:", error);

    return NextResponse.json(
      {
        ok: false,
        avisos: [],
        error: error?.message || "Error obteniendo avisos activos",
      },
      { status: 500 }
    );
  }
}