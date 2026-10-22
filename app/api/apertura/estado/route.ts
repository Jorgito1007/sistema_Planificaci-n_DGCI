import { NextResponse } from "next/server";

import {
  getPool,
  sql,
} from "@/lib/db";

import {
  getCurrentUserId,
} from "@/lib/current-user";

// ============================================================
// GET
// CONSULTAR ESTADO ACTUAL DE APERTURA DEL SISTEMA
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // VALIDAR USUARIO AUTENTICADO
    // ========================================================

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Usuario no autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // CONEXIÓN
    // ========================================================

    const pool =
      await getPool();

    // ========================================================
    // BUSCAR LA ÚLTIMA APERTURA ACTIVA
    // ========================================================

    const resultado =
      await pool
        .request()
        .query(`
          SELECT TOP 1
              A.Id,
              A.FechaInicio,
              A.FechaCierre,
              A.Observaciones,
              A.ActorUserId,
              A.Estado,
              A.CreateDay,
              U.FullName AS Usuario,

              CASE

                  -- CERRADO MANUALMENTE
                  WHEN A.Estado = 0
                  THEN 'CERRADO'

                  -- TODAVÍA NO LLEGA LA FECHA
                  WHEN CAST(GETDATE() AS DATE) < A.FechaInicio
                  THEN 'PROGRAMADO'

                  -- YA PASÓ LA FECHA DE CIERRE
                  WHEN CAST(GETDATE() AS DATE) > A.FechaCierre
                  THEN 'VENCIDO'

                  -- ESTAMOS DENTRO DEL PERÍODO
                  WHEN
                      A.Estado = 1
                      AND CAST(GETDATE() AS DATE)
                          BETWEEN A.FechaInicio
                          AND A.FechaCierre
                  THEN 'ABIERTO'

                  ELSE 'CERRADO'

              END AS EstadoSistema

          FROM dbo.Apertura_sistema AS A

          LEFT JOIN dbo.Usuarios_Dgci AS U
              ON A.ActorUserId = U.UserId

          ORDER BY
              A.Id DESC;
        `);

    // ========================================================
    // NO EXISTE NINGUNA APERTURA
    // ========================================================

    if (
      resultado.recordset.length === 0
    ) {
      return NextResponse.json({
        ok: true,

        sistemaAbierto: false,

        estado: "SIN_APERTURA",

        message:
          "No existe ningún período de apertura registrado.",

        apertura: null,
      });
    }

    // ========================================================
    // REGISTRO ENCONTRADO
    // ========================================================

    const apertura =
      resultado.recordset[0];

    const sistemaAbierto =
      apertura.EstadoSistema ===
      "ABIERTO";

    // ========================================================
    // MENSAJE SEGÚN ESTADO
    // ========================================================

    let message = "";

    switch (
      apertura.EstadoSistema
    ) {
      case "ABIERTO":
        message =
          "El sistema se encuentra abierto.";
        break;

      case "PROGRAMADO":
        message =
          "El período está programado, pero todavía no ha iniciado.";
        break;

      case "VENCIDO":
        message =
          "El período de apertura ha finalizado.";
        break;

      case "CERRADO":
        message =
          "El período fue cerrado.";
        break;

      default:
        message =
          "El sistema se encuentra cerrado.";
        break;
    }

    // ========================================================
    // RESPUESTA
    // ========================================================

    return NextResponse.json({
      ok: true,

      sistemaAbierto,

      estado:
        apertura.EstadoSistema,

      message,

      apertura: {
        id:
          apertura.Id,

        fechaInicio:
          apertura.FechaInicio,

        fechaCierre:
          apertura.FechaCierre,

        observaciones:
          apertura.Observaciones,

        estadoRegistro:
          Boolean(
            apertura.Estado
          ),

        usuario:
          apertura.Usuario ||
          "Usuario no disponible",

        createDay:
          apertura.CreateDay,
      },
    });
  } catch (error: any) {
    console.error(
      "ERROR GET /api/apertura/estado:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        sistemaAbierto: false,

        estado: "ERROR",

        message:
          "Ocurrió un error al consultar el estado del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}