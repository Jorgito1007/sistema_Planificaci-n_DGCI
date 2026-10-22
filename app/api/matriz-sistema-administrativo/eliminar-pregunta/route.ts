import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json(
        { error: "Falta questionId" },
        { status: 400 }
      );
    }

    const actorUserId = currentUser.userId;

    const roleKey = String(
      currentUser.roleKey || currentUser.role || ""
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    // ==========================================
    // VALIDAR ROL
    // ==========================================

    if (
      roleKey !== "administrador" &&
      roleKey !== "subadministrador"
    ) {
      return NextResponse.json(
        {
          error:
            "No tiene permisos para eliminar esta pregunta.",
        },
        { status: 403 }
      );
    }

    const pool = await getPool();

    // ==========================================
    // OBTENER DATOS DE LA PREGUNTA
    // ==========================================

    const preguntaResult = await pool
      .request()
      .input(
        "QuestionId",
        sql.Int,
        Number(questionId)
      )
      .query(`
        SELECT
          Id,
          Numero,
          Texto,
          Cargo,
          Existe,
          Aprobado,
          Difundido,
          EstaPresente,
          Implementado,
          Actualizado,
          EstaFuncionando,
          Calificacion,
          Nivel,
          TipoDocumento,
          Descripcion,
          FechaEmision,
          Interna,
          Externa
        FROM dbo.Matriz_SistemaAdministrativoDetalle
        WHERE Id = @QuestionId
      `);

    if (preguntaResult.recordset.length === 0) {
      return NextResponse.json(
        {
          error:
            "No se encontró la pregunta seleccionada.",
        },
        { status: 404 }
      );
    }

    const pregunta = preguntaResult.recordset[0];

    // ==========================================
    // CREAR DETALLE PARA AUDITORÍA
    // ==========================================

    const details = JSON.stringify({
      Numero: pregunta.Numero,
      Texto: pregunta.Texto,
      Cargo: pregunta.Cargo,
      Existe: pregunta.Existe,
      Aprobado: pregunta.Aprobado,
      Difundido: pregunta.Difundido,
      EstaPresente: pregunta.EstaPresente,
      Implementado: pregunta.Implementado,
      Actualizado: pregunta.Actualizado,
      EstaFuncionando: pregunta.EstaFuncionando,
      Calificacion: pregunta.Calificacion,
      Nivel: pregunta.Nivel,
      TipoDocumento: pregunta.TipoDocumento,
      Descripcion: pregunta.Descripcion,
      FechaEmision: pregunta.FechaEmision,
      Interna: pregunta.Interna,
      Externa: pregunta.Externa,
    });

    // ==========================================
    // ELIMINAR + AUDITAR
    // ==========================================

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // ------------------------------------------
      // Eliminar permisos asociados
      // ------------------------------------------

      await request
        .input(
          "QuestionId",
          sql.Int,
          Number(questionId)
        )
        .query(`
          DELETE FROM dbo.usuariosPreguntasPermisos
          WHERE QuestionId = @QuestionId;
        `);

      // ------------------------------------------
      // Eliminar pregunta
      // ------------------------------------------

      await request
        .input(
          "QuestionId2",
          sql.Int,
          Number(questionId)
        )
        .query(`
          DELETE FROM dbo.Matriz_SistemaAdministrativoDetalle
          WHERE Id = @QuestionId2;
        `);

      // ------------------------------------------
      // Registrar auditoría
      // ------------------------------------------

      await request
        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )
        .input(
          "Action",
          sql.NVarChar(200),
          "ELIMINAR"
        )
        .input(
          "Entity",
          sql.NVarChar(100),
          "Matriz_SistemaAdministrativoDetalle"
        )
        .input(
          "EntityId",
          sql.NVarChar(100),
          String(questionId)
        )
        .input(
          "Details",
          sql.NVarChar(sql.MAX),
          details
        )
        .query(`
          INSERT INTO dbo.Auditoria_Datos_Dgci
          (
            ActorUserId,
            Action,
            Entity,
            EntityId,
            Details
          )
          VALUES
          (
            @ActorUserId,
            @Action,
            @Entity,
            @EntityId,
            @Details
          );
        `);

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return NextResponse.json({
      ok: true,
      message: "Pregunta eliminada correctamente.",
    });

  } catch (error: any) {
    console.error("Error eliminando pregunta:", error);

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la pregunta.",
      },
      { status: 500 }
    );
  }
}