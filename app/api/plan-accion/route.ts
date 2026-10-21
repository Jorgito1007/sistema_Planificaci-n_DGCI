import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPool,
  sql,
} from "@/lib/db";

import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";


// ============================================================
// GET
// OBTENER PLAN DE ACCIÓN DEL USUARIO
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {

    // ==========================================================
    // 1. OBTENER USUARIO AUTENTICADO
    // ==========================================================

    let currentUser =
      await getCurrentUser();

    if (!currentUser) {

      const tokenUser =
        await getCurrentUserFromToken();

      if (tokenUser?.email) {

        currentUser =
          await getUserByEmail(
            tokenUser.email
          );
      }
    }


    if (!currentUser) {

      return NextResponse.json(
        {
          ok: false,
          message:
            "Usuario no autenticado",
        },
        {
          status: 401,
        }
      );
    }


    const actorUserId =
      currentUser.userId;


    // ==========================================================
    // 2. CONEXIÓN
    // ==========================================================

    const pool =
      await getPool();


    // ==========================================================
    // 3. OBTENER PREGUNTAS + BORRADOR/PLAN GUARDADO
    // ==========================================================
    //
    // OUTER APPLY obtiene el registro más reciente
    // del Plan de Acción correspondiente a:
    //
    // Usuario + Número de pregunta
    //
    // Si nunca ha guardado:
    // PA será NULL.
    //
    // ==========================================================

    const result = await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`

        SELECT

          SAD.Numero,

          SAD.Texto,

          SAD.Calificacion,

          SAD.Nivel,

          US.FullName,

          SAD.Cargo,


          -- ==============================================
          -- DATOS GUARDADOS DEL PLAN
          -- ==============================================

          PA.Id
            AS PlanAccionId,

          PA.PeriodoInicio,

          PA.PeriodoFin,

          PA.Deficiencia,

          PA.Actividades,

          PA.FechaInicio,

          PA.FechaFin,

          PA.Contacto,

          PA.Recursos,

          PA.Entregable,

          PA.Estado,

          PA.FechaRegistro


        FROM
          dbo.Matriz_SistemaAdministrativoDetalle
          AS SAD


        LEFT JOIN
          dbo.Usuarios_Dgci
          AS US

          ON
            SAD.ActorUserId =
            US.UserId


        OUTER APPLY
        (
          SELECT TOP 1

            P.Id,

            P.PeriodoInicio,

            P.PeriodoFin,

            P.Deficiencia,

            P.Actividades,

            P.FechaInicio,

            P.FechaFin,

            P.Contacto,

            P.Recursos,

            P.Entregable,

            P.Estado,

            P.FechaRegistro

          FROM
            dbo.PlanAccionSAdministrativo
            AS P

          WHERE
            P.ActorUserId =
              @ActorUserId

            AND
            P.NumeroPregunta =
              SAD.Numero

          ORDER BY
            P.Id DESC

        ) AS PA


        WHERE

         SAD.ActorUserId = @ActorUserId
  AND SAD.Calificacion BETWEEN 1 AND 4


        ORDER BY
          SAD.Numero;

      `);


    // ==========================================================
    // 4. DETERMINAR ESTADO GENERAL DEL PLAN
    // ==========================================================

    const registros =
      result.recordset;


    const planEnviado =
      registros.some(
        (item: any) =>
          item.Estado === true ||
          item.Estado === 1
      );


    const tieneBorrador =
      registros.some(
        (item: any) =>
          item.PlanAccionId != null &&
          (
            item.Estado === false ||
            item.Estado === 0
          )
      );


    // ==========================================================
    // 5. OBTENER PERÍODO GUARDADO
    // ==========================================================

    const registroConPeriodo =
      registros.find(
        (item: any) =>
          item.PeriodoInicio ||
          item.PeriodoFin
      );


    const periodoInicio =
      registroConPeriodo
        ?.PeriodoInicio ??
      null;


    const periodoFin =
      registroConPeriodo
        ?.PeriodoFin ??
      null;


    // ==========================================================
    // 6. RESPUESTA
    // ==========================================================

    return NextResponse.json({
      ok: true,

      data: registros,

      planEnviado,

      tieneBorrador,

      periodoInicio,

      periodoFin,
    });

  } catch (error: unknown) {

    console.error(
      "ERROR OBTENIENDO PLAN DE ACCIÓN:",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "No se pudo obtener el Plan de Acción.",
      },
      {
        status: 500,
      }
    );
  }
}