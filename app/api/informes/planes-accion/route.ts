import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de plan requerido" },
        { status: 400 }
      );
    }

    const tabla =
      tipo === "sistema-administrativo"
        ? "dbo.PlanAccionSAdministrativo"
        : "dbo.PlanAccionSPorComponentes";

    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        CONVERT(varchar(36), p.ActorUserId) AS UserId,
        u.FullName,
        u.Email,
        CONVERT(varchar(19), MAX(p.FechaRegistro), 120) AS FechaEnvio,
        CONVERT(varchar(10), MIN(p.PeriodoInicio), 120) AS PeriodoInicio,
        CONVERT(varchar(10), MAX(p.PeriodoFin), 120) AS PeriodoFin,
        COUNT(*) AS TotalActividades
      FROM ${tabla} p
      LEFT JOIN dbo.Usuarios_Dgci u
        ON u.UserId = p.ActorUserId
      WHERE p.ActorUserId IS NOT NULL
      GROUP BY
        p.ActorUserId,
        u.FullName,
        u.Email
      ORDER BY MAX(p.FechaRegistro) DESC
    `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error informe planes:", error);

    return NextResponse.json(
      { error: "Error al cargar planes de acción" },
      { status: 500 }
    );
  }
}