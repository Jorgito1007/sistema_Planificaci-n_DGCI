import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    const actorUserId = await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no autenticado",
        },
        { status: 401 }
      );
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("ActorUserId", sql.UniqueIdentifier, actorUserId)
      .query(`
        SELECT
          Numero,
          Texto,
          Calificacion,
          Nivel
        FROM dbo.EvaluacionesPrincipioDetalleDGCI
        WHERE ActorUserId = @ActorUserId
          AND Calificacion < 5
        ORDER BY Numero
      `);

    return NextResponse.json({
      ok: true,
      data: result.recordset,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        ok: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}