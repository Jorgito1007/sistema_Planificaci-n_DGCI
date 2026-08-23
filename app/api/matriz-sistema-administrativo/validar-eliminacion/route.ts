import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.userId) {
      return NextResponse.json(
        {
          ok: false,
          puedeEliminar: false,
          message: "No autenticado.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const questionId = Number(body.questionId);

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json(
        {
          ok: false,
          puedeEliminar: false,
          message: "El identificador de la pregunta no es válido.",
        },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const permisoRol = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .query(`
        SELECT TOP 1
          1 AS TienePermiso
        FROM dbo.UserRoles_Dgci ur
        INNER JOIN dbo.Roles_Dgci r
          ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
          AND r.CanDeleteMatrixItems = 1;
      `);

    if (permisoRol.recordset.length > 0) {
      return NextResponse.json({
        ok: true,
        puedeEliminar: true,
        tipoPermiso: "rol",
      });
    }

    const permisoPregunta = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .input(
        "QuestionId",
        sql.Int,
        questionId
      )
      .query(`
        SELECT TOP 1
          upp.CanDelete
        FROM dbo.usuariosPreguntasPermisos upp
        INNER JOIN dbo.Matriz_SistemaAdministrativoDetalle md
          ON md.Id = upp.QuestionId
        WHERE upp.UserId = @UserId
          AND upp.QuestionId = @QuestionId
          AND md.Id = @QuestionId
          AND upp.CanDelete = 1;
      `);

    if (permisoPregunta.recordset.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          puedeEliminar: false,
          message:
            "Estimado usuario, no tiene permisos para eliminar este ítem de pregunta.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      puedeEliminar: true,
      tipoPermiso: "pregunta",
    });
  } catch (error: unknown) {
    console.error("Error validando eliminación:", error);

    return NextResponse.json(
      {
        ok: false,
        puedeEliminar: false,
        message:
          "Ocurrió un error al validar el permiso de eliminación.",
      },
      { status: 500 }
    );
  }
}