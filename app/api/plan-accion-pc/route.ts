import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    // ============================================================
    // 1. USUARIO AUTENTICADO
    // ============================================================

    const actorUserId = await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const pool = await getPool();

    // ============================================================
    // 2. CONSULTAR PREGUNTAS QUE REQUIEREN PLAN DE ACCIÓN
    //    SOLO CALIFICACIONES 1, 2, 3 Y 4
    // ============================================================

    const preguntasResult = await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        SELECT
          ev.Numero,
          ev.Texto,
          ev.Calificacion,
          ev.Nivel,
          US.FullName,
          ev.Cargo

        FROM dbo.EvaluacionesPrincipioDetalleDGCI AS ev

        LEFT JOIN dbo.Usuarios_Dgci AS US
          ON ev.ActorUserId = US.UserId

        WHERE
          ev.ActorUserId = @ActorUserId

          AND ev.Calificacion >= 1
          AND ev.Calificacion <= 4

        ORDER BY ev.Numero;
      `);

    // ============================================================
    // 3. BUSCAR REGISTROS GUARDADOS DEL USUARIO
    // ============================================================

    const guardadosResult = await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        SELECT
          Id,
          PeriodoInicio,
          PeriodoFin,
          NumeroPregunta,
          DescripcionPregunta,
          Clasificacion,
          Nivel,
          Deficiencia,
          Actividades,
          FechaInicio,
          FechaFin,
          Cargo,
          Contacto,
          Recursos,
          Entregable,
          ActorUserId,
          Estado

        FROM dbo.PlanAccionSPorComponentes

        WHERE ActorUserId = @ActorUserId

        ORDER BY Id;
      `);

    const preguntas = preguntasResult.recordset;
    const guardados = guardadosResult.recordset;

    // ============================================================
    // 4. DETERMINAR SI EL PLAN YA FUE ENVIADO
    // ============================================================

    const planEnviado =
      guardados.length > 0 &&
      guardados.some(
        (item: any) =>
          Boolean(item.Estado) === true
      );

    // ============================================================
    // 5. PERÍODO GUARDADO
    // ============================================================

    const primerRegistro =
      guardados.length > 0
        ? guardados[0]
        : null;

    // ============================================================
    // 6. MEZCLAR PREGUNTAS CON BORRADOR/PLAN GUARDADO
    // ============================================================

    const data = preguntas.map(
      (pregunta: any) => {
        const guardado =
          guardados.find(
            (item: any) =>
              String(
                item.NumeroPregunta
              ).trim() ===
              String(
                pregunta.Numero
              ).trim()
          );

        return {
          Numero:
            pregunta.Numero,

          Texto:
            pregunta.Texto,

          Calificacion:
            pregunta.Calificacion,

          Nivel:
            pregunta.Nivel,

          FullName:
            pregunta.FullName,

          Cargo:
            guardado?.Cargo ??
            pregunta.Cargo ??
            "",

          Deficiencia:
            guardado?.Deficiencia ??
            "",

          Actividades:
            guardado?.Actividades ??
            "",

          FechaInicio:
            guardado?.FechaInicio ??
            null,

          FechaFin:
            guardado?.FechaFin ??
            null,

          Contacto:
            guardado?.Contacto ??
            "",

          Recursos:
            guardado?.Recursos ??
            "",

          Entregable:
            guardado?.Entregable ??
            "",

          Estado:
            guardado?.Estado ??
            0,
        };
      }
    );

    // ============================================================
    // 7. RESPUESTA
    // ============================================================

    return NextResponse.json({
      ok: true,

      data,

      periodoInicio:
        primerRegistro?.PeriodoInicio ??
        null,

      periodoFin:
        primerRegistro?.PeriodoFin ??
        null,

      planEnviado,
    });

  } catch (error: any) {
    console.error(
      "ERROR GET PLAN ACCIÓN COMPONENTES:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo obtener el Plan de Acción.",
      },
      {
        status: 500,
      }
    );
  }
}