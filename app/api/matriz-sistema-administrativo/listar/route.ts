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

    // 1. Obtener SubModuleId a partir del SubModuleKey
    const submoduleResult = await pool
      .request()
      .input("SubModuleKey", sql.VarChar(100), subModuleKey)
      .query(`
        SELECT TOP 1 SubModuleId, SubModuleKey, SubModuleName
        FROM submodulos_dgci
        WHERE SubModuleKey = @SubModuleKey
      `);

    const submodule = submoduleResult.recordset?.[0];

    if (!submodule) {
      return NextResponse.json(
        { ok: false, message: "Submódulo no encontrado." },
        { status: 404 }
      );
    }

    // 2. Obtener directamente el detalle por SubModuleId
    const detalleResult = await pool
      .request()
      .input("SubModuleId", sql.Int, submodule.SubModuleId)
      .execute("sp_ObtenerDetalleMatrizSistemaAdministrativoPorSubmodulo");

    return NextResponse.json({
      ok: true,
      data: {
        subModuleId: submodule.SubModuleId,
        subModuleKey: submodule.SubModuleKey,
        subModuleName: submodule.SubModuleName,
        preguntas: (detalleResult.recordset || []).map((d: any) => ({
          id: d.Id,
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
      },
    });
  } catch (error: any) {
    console.error("Error listando matriz:", error);

    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}