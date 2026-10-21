import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";


// ============================================================
// GET
// INFORME: AVANCE DE REGISTROS POR USUARIO
// ============================================================

export async function GET() {
  try {

    // =========================================================
    // OBTENER CONEXIÓN
    // =========================================================

    const pool = await getPool();


    // =========================================================
    // EJECUTAR PROCEDIMIENTO ALMACENADO
    // =========================================================

    const result = await pool
      .request()
      .execute("dbo.sp_InformeAvanceRegistrosPorUsuario");


    // =========================================================
    // RESULTADOS DEL PROCEDIMIENTO
    // =========================================================

    const usuarios = result.recordset ?? [];


    // =========================================================
    // NORMALIZAR RESPUESTA
    // =========================================================

    const data = usuarios.map((item: any) => ({
      usuarioId: item.UsuarioId,

      nombreUsuario:
        item.NombreUsuario ?? "Sin nombre",

      email:
        item.Email ?? "",

      cargo:
        item.Cargo ?? "Sin cargo registrado",


      // -------------------------------------------------------
      // SISTEMA ADMINISTRATIVO
      // -------------------------------------------------------

      asignadasSistema:
        Number(item.AsignadasSistema ?? 0),

      registradasSistema:
        Number(item.RegistradasSistema ?? 0),

      pendientesSistema:
        Number(item.PendientesSistema ?? 0),


      // -------------------------------------------------------
      // MATRIZ POR COMPONENTES
      // -------------------------------------------------------

      asignadasComponentes:
        Number(item.AsignadasComponentes ?? 0),

      registradasComponentes:
        Number(item.RegistradasComponentes ?? 0),

      pendientesComponentes:
        Number(item.PendientesComponentes ?? 0),


      // -------------------------------------------------------
      // TOTALES
      // -------------------------------------------------------

      totalAsignadas:
        Number(item.TotalAsignadas ?? 0),

      totalRegistradas:
        Number(item.TotalRegistradas ?? 0),

      totalPendientes:
        Number(item.TotalPendientes ?? 0),

      porcentajeAvance:
        Number(item.PorcentajeAvance ?? 0),
    }));


    // =========================================================
    // RESPUESTA
    // =========================================================

    return NextResponse.json(data, {
      status: 200,
    });

  } catch (error) {

    console.error(
      "Error al obtener avance de registros por usuario:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Error al obtener el avance de registros por usuario.",
      },
      {
        status: 500,
      }
    );
  }
}