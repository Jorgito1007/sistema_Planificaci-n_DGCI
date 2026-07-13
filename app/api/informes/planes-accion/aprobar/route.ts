import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { tipo, userId, observaciones } = await req.json();

    if (!tipo || !userId) {
      return NextResponse.json(
        { ok: false, message: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    if (!observaciones || observaciones.trim() === "") {
      return NextResponse.json(
        { ok: false, message: "Debe ingresar observaciones." },
        { status: 400 }
      );
    }

    const tabla =
      tipo === "sistema-administrativo"
        ? "dbo.PlanAccionSAdministrativo"
        : tipo === "por-componentes"
        ? "dbo.PlanAccionSPorComponentes"
        : null;

    if (!tabla) {
      return NextResponse.json(
        { ok: false, message: "Tipo de plan inválido." },
        { status: 400 }
      );
    }

    const pool = await getPool();

    await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .input("Observaciones", sql.NVarChar(sql.MAX), observaciones.trim())
      .query(`
        UPDATE ${tabla}
        SET
          Observaciones = @Observaciones,
          Estado = 1
        WHERE ActorUserId = @UserId
      `);

    return NextResponse.json({
      ok: true,
      message: "Plan aprobado correctamente.",
    });
  } catch (error) {
    console.error("Error aprobando plan:", error);

    return NextResponse.json(
      { ok: false, message: "Error interno al aprobar el plan." },
      { status: 500 }
    );
  }
}