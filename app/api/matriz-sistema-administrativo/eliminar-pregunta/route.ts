import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "Falta questionId" }, { status: 400 });
    }

    const roleKey = String(currentUser.roleKey || currentUser.role || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    if (roleKey !== "administrador" && roleKey !== "subadministrador") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar esta pregunta." },
        { status: 403 }
      );
    }

    const pool = await getPool();

    await pool
      .request()
      .input("QuestionId", sql.Int, Number(questionId))
      .query(`
        DELETE FROM dbo.usuariosPreguntasPermisos
        WHERE QuestionId = @QuestionId;

        DELETE FROM dbo.Matriz_SistemaAdministrativoDetalle
        WHERE Id = @QuestionId;
      `);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "No se pudo eliminar" },
      { status: 500 }
    );
  }
}