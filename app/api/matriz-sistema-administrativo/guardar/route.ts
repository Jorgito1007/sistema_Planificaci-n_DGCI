import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

export async function POST(req: NextRequest) {
  try {
    console.log("ENTRÓ A GUARDAR MATRIZ");

    const body = await req.json();
    console.log("BODY:", body);

    const pool = await getPool();

    let currentUser = await getCurrentUser();

    if (!currentUser) {
      const tokenUser = await getCurrentUserFromToken();

      if (tokenUser?.email) {
        currentUser = await getUserByEmail(tokenUser.email);
      }
    }

    console.log("CURRENT USER:", currentUser);

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const actorUserId = currentUser.userId;

    const roleKey = String(
  currentUser.roleKey || currentUser.role || ""
)
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "");

const isAdmin =
  roleKey === "administrador" ||
  roleKey === "subadministrador";

    if (!body.subModuleKey) {
      return NextResponse.json(
        { error: "Falta subModuleKey" },
        { status: 400 }
      );
    }

    const permiso = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, actorUserId)
      .input("SubModuleKey", sql.VarChar(100), body.subModuleKey)
      .query(`
        SELECT TOP 1
          usp.CanView
        FROM dbo.usuariosSubmodulospermisos usp
        INNER JOIN dbo.submodulos_dgci s
          ON s.SubModuleId = usp.SubModuleId
        WHERE usp.UserId = @UserId
          AND LOWER(s.SubModuleKey) = LOWER(@SubModuleKey)
          AND usp.CanView = 1
      `);

    console.log("PERMISOS:", permiso.recordset);

  if (!isAdmin && permiso.recordset.length === 0) {
  return NextResponse.json(
    { error: "No tiene permiso para guardar este submódulo" },
    { status: 403 }
  );
}

    const cabecera = await pool
      .request()
      .input("SubModuleKey", sql.VarChar(100), body.subModuleKey)
      .execute("sp_GuardarMatrizSistemaAdministrativoCabecera");

    const matrizId =
      cabecera.recordset?.[0]?.MatrizSistemaAdministrativoId;

    if (!matrizId) {
      return NextResponse.json(
        { ok: false, message: "No se pudo obtener el ID de la matriz." },
        { status: 500 }
      );
    }

   /* await pool
      .request()
      .input("MatrizSistemaAdministrativoId", sql.Int, matrizId)
      .execute("sp_EliminarDetalleMatrizSistemaAdministrativo");*/

      

for (const p of body.preguntas || []) {
  const questionId = Number(p.id || p.Id || 0);

  const existeNumero = await pool
    .request()
    .input("MatrizSistemaAdministrativoId", sql.Int, matrizId)
    .input("Numero", sql.VarChar(30), p.numero)
    .input("QuestionId", sql.Int, questionId)
    .query(`
      SELECT TOP 1 Id
      FROM dbo.Matriz_SistemaAdministrativoDetalle
      WHERE MatrizSistemaAdministrativoId = @MatrizSistemaAdministrativoId
        AND Numero = @Numero
        AND (@QuestionId = 0 OR Id <> @QuestionId)
    `);

  if (existeNumero.recordset.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Ya existe una pregunta con la numeración ${p.numero}.`,
      },
      { status: 409 }
    );
  }

  let actorUserIdParaGuardar = actorUserId;

  if (isAdmin && questionId > 0) {
    const original = await pool
      .request()
      .input("QuestionId", sql.Int, questionId)
      .query(`
        SELECT TOP 1 ActorUserId
        FROM dbo.Matriz_SistemaAdministrativoDetalle
        WHERE Id = @QuestionId
      `);

    actorUserIdParaGuardar =
      original.recordset[0]?.ActorUserId || actorUserId;
  }

  if (!isAdmin && questionId > 0) {
    const asignada = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, actorUserId)
      .input("QuestionId", sql.Int, questionId)
      .query(`
        SELECT TOP 1 QuestionId
        FROM dbo.usuariosPreguntasPermisos
        WHERE UserId = @UserId
          AND QuestionId = @QuestionId
          AND CanEdit = 1
      `);

    if (asignada.recordset.length > 0) {
      actorUserIdParaGuardar = actorUserId;
    }
  }

  await pool
    .request()
    .input("Id", sql.Int, questionId > 0 ? questionId : null)
    .input("MatrizSistemaAdministrativoId", sql.Int, matrizId)
    .input("Numero", sql.VarChar(30), p.numero)
    .input("Texto", sql.NVarChar(sql.MAX), p.texto)
    .input("Cargo", sql.NVarChar(255), p.cargo || "")
    .input("Existe", sql.Int, p.existe ?? 0)
    .input("Aprobado", sql.Int, p.aprobado ?? 0)
    .input("Difundido", sql.Int, p.difundido ?? 0)
    .input("EstaPresente", sql.VarChar(2), p.estaPresente || "NO")
    .input("Implementado", sql.Int, p.implementado ?? 0)
    .input("Actualizado", sql.Int, p.actualizado ?? 0)
    .input("EstaFuncionando", sql.VarChar(2), p.estaFuncionando || "NO")
    .input("Calificacion", sql.Int, p.calificacion ?? 0)
    .input("Nivel", sql.VarChar(20), p.nivel || "")
    .input("TipoDocumento", sql.NVarChar(255), p.tipoDocumento || "")
    .input("Descripcion", sql.NVarChar(sql.MAX), p.descripcion || "")
    .input("FechaEmision", sql.Date, p.fechaEmision || null)
    .input("Interna", sql.NVarChar(sql.MAX), p.interna || null)
    .input("Externa", sql.NVarChar(sql.MAX), p.externa || null)
    .input("ActorUserId", sql.UniqueIdentifier, actorUserIdParaGuardar)
    .execute("sp_InsertarMatrizSistemaAdministrativoDetalle");
}
    return NextResponse.json({
      ok: true,
      matrizId,
    });
  } catch (error: any) {
    console.error("Error guardando matriz:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}