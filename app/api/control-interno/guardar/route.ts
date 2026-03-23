import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { max } from "date-fns";
import { MAX } from "mssql";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pool = await getPool();

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

    const evaluacionPrincipioId =
      cabecera.recordset?.[0]?.EvaluacionPrincipioId;

    if (!evaluacionPrincipioId) {
      return NextResponse.json(
        { ok: false, message: "No se pudo obtener el ID de evaluación." },
        { status: 500 }
      );
    }

    for (const p of body.preguntas || []) {
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
        .execute("sp_InsertarEvaluacionPrincipioDetalleDGCI");
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