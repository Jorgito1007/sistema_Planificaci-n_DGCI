import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subModuleKey = searchParams.get("subModuleKey");

    if (!subModuleKey) {
      return NextResponse.json(
        { ok: false, message: "SubModuleKey requerido" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const cabecerasResult = await pool
      .request()
      .input("SubModuleKey", sql.VarChar(100), subModuleKey)
      .execute("sp_ObtenerEvaluacionesPorSubmoduloDGCI");

    const cabeceras = cabecerasResult.recordset || [];
    const registros: any[] = [];

    for (const cabecera of cabeceras) {
      const detalleResult = await pool
        .request()
        .input("EvaluacionPrincipioId", sql.Int, cabecera.Id)
        .execute("sp_ObtenerDetalleEvaluacionDGCI");

      registros.push({
        principioId: cabecera.PrincipioId,
        principioTitulo: cabecera.PrincipioTitulo,
        color: cabecera.Color,
        rowColor: cabecera.RowColor,

        preguntaGeneral: {
          numero: cabecera.PreguntaGeneralNumero,
          texto: cabecera.PreguntaGeneralTexto,
        },

      preguntas: (detalleResult.recordset || []).map((d: any) => ({
  numero: d.Numero ?? "",
  texto: d.Texto ?? "",
  cargo: d.Cargo ?? "",
  existe: d.Existe ?? 0,
  aprobado: d.Aprobado ?? 0,
  difundido: d.Difundido ?? 0,
  estaPresente: d.EstaPresente ?? "NO",
  implementado: d.Implementado ?? 0,
  actualizado: d.Actualizado ?? 0,
  estaFuncionando: d.EstaFuncionando ?? "NO",
  calificacion: d.Calificacion ?? 0,
  nivel: d.Nivel ?? "",
  tipoDocumento: d.TipoDocumento ?? "",
  descripcion: d.Descripcion ?? "",
  fechaEmision: d.FechaEmision
    ? new Date(d.FechaEmision).toISOString().split("T")[0]
    : "",
  interna: d.Interna ?? "",
  externa: d.Externa ?? "",
})),
      });
    }

    return NextResponse.json({
      ok: true,
      data: registros,
    });

  } catch (error: any) {
    console.error("Error listando:", error);

    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}