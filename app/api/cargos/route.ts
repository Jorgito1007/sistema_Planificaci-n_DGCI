import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        Id,
        CargoKey,
        NombreCargo
      FROM dbo.CargosDGCI
      ORDER BY NombreCargo
    `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error cargando cargos:", error);

    return NextResponse.json(
      { error: "Error al cargar cargos" },
      { status: 500 }
    );
  }
}