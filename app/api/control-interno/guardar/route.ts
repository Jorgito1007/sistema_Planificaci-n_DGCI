import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pool = await getPool();

    let currentUser = await getCurrentUser();

    if (!currentUser) {
      const tokenUser = await getCurrentUserFromToken();

      if (tokenUser?.email) {
        currentUser = await getUserByEmail(tokenUser.email);
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const actorUserId = currentUser.userId;
    const role = String(currentUser.role || "").toLowerCase();

    const puedeCrearPreguntas =
      role === "administrador" || role === "subadministrador";

    if (!body.subModuleKey) {
      return NextResponse.json({ error: "Falta subModuleKey" }, { status: 400 });
    }

    if (!body.principioId) {
      return NextResponse.json({ error: "Falta principioId" }, { status: 400 });
    }

    if (!puedeCrearPreguntas) {
      const permiso = await pool
        .request()
        .input("UserId", sql.UniqueIdentifier, actorUserId)
        .input("SubModuleKey", sql.VarChar(100), body.subModuleKey)
        .input("PrincipioId", sql.Int, body.principioId)
        .query(`
          SELECT TOP 1 upp.CanView, upp.CanEdit
          FROM dbo.usuariosPrincipiosPermisos upp
          INNER JOIN dbo.submodulos_dgci s
            ON s.SubModuleId = upp.SubModuleId
          WHERE upp.UserId = @UserId
            AND LOWER(s.SubModuleKey) = LOWER(@SubModuleKey)
            AND upp.PrincipioId = @PrincipioId
            AND (ISNULL(upp.CanView, 0) = 1 OR ISNULL(upp.CanEdit, 0) = 1)
        `);

      if (permiso.recordset.length === 0) {
        return NextResponse.json(
          { error: "No tiene permiso para este principio" },
          { status: 403 }
        );
      }
    }

    let evaluacionPrincipioId: number | null = null;

    if (puedeCrearPreguntas) {
      const cabecera = await pool
        .request()
        .input("SubModuleKey", sql.VarChar(100), body.subModuleKey)
        .input("PrincipioId", sql.Int, body.principioId)
        .input("PrincipioTitulo", sql.VarChar(100), body.principioTitulo)
        .input("Color", sql.VarChar(50), body.color)
        .input("RowColor", sql.VarChar(50), body.rowColor)
        .input("PreguntaGeneralNumero", sql.VarChar(30), body.preguntaGeneral.numero)
        .input("PreguntaGeneralTexto", sql.NVarChar(sql.MAX), body.preguntaGeneral.texto)
        .execute("sp_GuardarEvaluacionPrincipioCabeceraDGCI");

      evaluacionPrincipioId = cabecera.recordset?.[0]?.EvaluacionPrincipioId;

      if (!evaluacionPrincipioId) {
        return NextResponse.json(
          { ok: false, message: "No se pudo obtener el ID de evaluación." },
          { status: 500 }
        );
      }

      await pool
        .request()
        .input("EvaluacionPrincipioId", sql.Int, evaluacionPrincipioId)
        .query(`
          DELETE FROM dbo.EvaluacionesPrincipioDetalleDGCI
          WHERE EvaluacionPrincipioId = @EvaluacionPrincipioId
        `);
    } else {
      const existente = await pool
        .request()
        .input("SubModuleKey", sql.VarChar(100), body.subModuleKey)
        .input("PrincipioId", sql.Int, body.principioId)
        .query(`
          SELECT TOP 1 ep.Id AS EvaluacionPrincipioId
          FROM dbo.EvaluacionesPrincipioDGCI ep
          INNER JOIN dbo.submodulos_dgci s
            ON s.SubModuleId = ep.SubModuleId
          WHERE LOWER(s.SubModuleKey) = LOWER(@SubModuleKey)
            AND ep.PrincipioId = @PrincipioId
        `);

      evaluacionPrincipioId = existente.recordset?.[0]?.EvaluacionPrincipioId;

      if (!evaluacionPrincipioId) {
        return NextResponse.json(
          {
            error:
              "No existe evaluación para este principio. Debe crearla un administrador.",
          },
          { status: 404 }
        );
      }
    }

    for (const p of body.preguntas || []) {
      if (puedeCrearPreguntas) {
        await pool
          .request()
          .input("EvaluacionPrincipioId", sql.Int, evaluacionPrincipioId)
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
          .input("ActorUserId", sql.UniqueIdentifier, actorUserId)
          .execute("sp_InsertarEvaluacionPrincipioDetalleDGCI");
      } else {
        await pool
          .request()
          .input("EvaluacionPrincipioId", sql.Int, evaluacionPrincipioId)
          .input("Numero", sql.VarChar(30), p.numero)
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
          .input("ActorUserId", sql.UniqueIdentifier, actorUserId)
          .query(`
            UPDATE dbo.EvaluacionesPrincipioDetalleDGCI
            SET
              Cargo = @Cargo,
              Existe = @Existe,
              Aprobado = @Aprobado,
              Difundido = @Difundido,
              EstaPresente = @EstaPresente,
              Implementado = @Implementado,
              Actualizado = @Actualizado,
              EstaFuncionando = @EstaFuncionando,
              Calificacion = @Calificacion,
              Nivel = @Nivel,
              TipoDocumento = @TipoDocumento,
              Descripcion = @Descripcion,
              FechaEmision = @FechaEmision,
              Interna = @Interna,
              Externa = @Externa,
              ActorUserId = @ActorUserId
            WHERE EvaluacionPrincipioId = @EvaluacionPrincipioId
              AND Numero = @Numero
          `);
      }
    }

    return NextResponse.json({
      ok: true,
      evaluacionPrincipioId,
    });
  } catch (error: any) {
    console.error("Error guardando:", error);

    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}