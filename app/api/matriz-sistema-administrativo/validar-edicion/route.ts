import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { questionId } = await req.json();

    const roleKey = String(
      currentUser.roleKey || currentUser.role || ""
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    if (
      roleKey === "administrador" ||
      roleKey === "subadministrador"
    ) {
      return NextResponse.json({
        ok: true,
        puedeEditar: true,
      });
    }

    const pool = await getPool();

    const permiso = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, currentUser.userId)
      .input("QuestionId", sql.Int, Number(questionId))
      .query(`
        SELECT TOP 1
          upp.CanEdit,
          msad.ActorUserId
        FROM dbo.usuariosPreguntasPermisos upp
        INNER JOIN dbo.Matriz_SistemaAdministrativoDetalle msad
           ON msad.ActorUserId = upp.UserId
        WHERE upp.UserId = @UserId
          AND upp.QuestionId = @QuestionId
          AND msad.ActorUserId = @UserId
          AND upp.CanEdit = 1
      `);

    if (permiso.recordset.length === 0) {
      return NextResponse.json({
        ok: false,
        puedeEditar: false,
        message: "Estimado usuario, no tiene permisos para editar este ítem de pregunta.",
      });
    }

    return NextResponse.json({
      ok: true,
      puedeEditar: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        puedeEditar: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}