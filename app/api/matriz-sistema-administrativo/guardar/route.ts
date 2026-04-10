import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pool = await getPool();

    // 🔹 1. Obtener o crear la matriz por submódulo
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

   await pool
  .request()
  .input("MatrizSistemaAdministrativoId", sql.Int, matrizId)
  .execute("sp_EliminarDetalleMatrizSistemaAdministrativo");

    // 🔹 3. Insertar preguntas
    for (const p of body.preguntas || []) {
      await pool
        .request()
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
        .execute("sp_InsertarMatrizSistemaAdministrativoDetalle");
    }

    return NextResponse.json({
      ok: true,
      matrizId,
    });

  } catch (error: any) {
    console.error("Error guardando matriz:", error);

    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}