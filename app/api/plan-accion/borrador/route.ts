import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPool,
  sql,
} from "@/lib/db";

import {
  getCurrentUserId,
} from "@/lib/current-user";


// ============================================================
// POST
// GUARDAR / ACTUALIZAR BORRADOR DEL PLAN DE ACCIÓN
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {

    // ==========================================================
    // 1. USUARIO AUTENTICADO
    // ==========================================================

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se pudo identificar al usuario autenticado.",
        },
        {
          status: 401,
        }
      );
    }


    // ==========================================================
    // 2. BODY
    // ==========================================================

    const body = await req.json();

    const {
      periodoInicio,
      periodoFin,
      filas,
    } = body;


    if (
      !Array.isArray(filas) ||
      filas.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No existen registros para guardar.",
        },
        {
          status: 400,
        }
      );
    }


    const pool = await getPool();


    // ==========================================================
    // 3. VERIFICAR SI EL PLAN YA FUE ENVIADO
    // ==========================================================
    // Si existe cualquier registro Estado = 1
    // perteneciente al usuario, no permitimos modificaciones.
    // ==========================================================

    const planCerrado = await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        SELECT TOP 1
          Id
        FROM dbo.PlanAccionSAdministrativo
        WHERE
          ActorUserId = @ActorUserId
          AND Estado = 1;
      `);


    if (
      planCerrado.recordset.length > 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El Plan de Acción ya fue enviado y no puede modificarse.",
        },
        {
          status: 409,
        }
      );
    }


    // ==========================================================
    // 4. TRANSACCIÓN
    // ==========================================================

    const transaction =
      new sql.Transaction(pool);

    await transaction.begin();


    try {

      // ========================================================
      // 5. RECORRER FILAS
      // ========================================================

      for (const fila of filas) {

        if (!fila.numeroPregunta) {
          continue;
        }


        const request =
          new sql.Request(transaction);


        request.input(
          "PeriodoInicio",
          sql.Date,
          periodoInicio || null
        );

        request.input(
          "PeriodoFin",
          sql.Date,
          periodoFin || null
        );

        request.input(
          "NumeroPregunta",
          sql.VarChar(100),
          String(
            fila.numeroPregunta
          ).trim()
        );

        request.input(
          "DescripcionPregunta",
          sql.NVarChar(sql.MAX),
          fila.descripcionPregunta || ""
        );

        request.input(
          "Clasificacion",
          sql.Int,
          fila.clasificacion !== "" &&
          fila.clasificacion !== null &&
          fila.clasificacion !== undefined
            ? Number(
                fila.clasificacion
              )
            : null
        );

        request.input(
          "Nivel",
          sql.VarChar(50),
          fila.nivel || ""
        );

        request.input(
          "Deficiencia",
          sql.NVarChar(sql.MAX),
          fila.deficiencia || ""
        );

        request.input(
          "Actividades",
          sql.NVarChar(sql.MAX),
          fila.actividades || ""
        );

        request.input(
          "FechaInicio",
          sql.Date,
          fila.fechaInicio || null
        );

        request.input(
          "FechaFin",
          sql.Date,
          fila.fechaFin || null
        );

        request.input(
          "Cargo",
          sql.NVarChar(200),
          fila.cargo || ""
        );

        request.input(
          "Contacto",
          sql.NVarChar(200),
          fila.contacto || ""
        );

        request.input(
          "Recursos",
          sql.NVarChar(sql.MAX),
          fila.recursos || ""
        );

        request.input(
          "Entregable",
          sql.NVarChar(sql.MAX),
          fila.entregable || ""
        );

        request.input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        );


        // ======================================================
        // 6. UPDATE SI YA EXISTE
        // INSERT SI ES NUEVO
        // ======================================================

        await request.query(`
          IF EXISTS (
            SELECT 1
            FROM dbo.PlanAccionSAdministrativo
            WHERE
              ActorUserId = @ActorUserId
              AND NumeroPregunta = @NumeroPregunta
              AND Estado = 0
          )
          BEGIN

            UPDATE dbo.PlanAccionSAdministrativo

            SET
              PeriodoInicio =
                @PeriodoInicio,

              PeriodoFin =
                @PeriodoFin,

              DescripcionPregunta =
                @DescripcionPregunta,

              Clasificacion =
                @Clasificacion,

              Nivel =
                @Nivel,

              Deficiencia =
                @Deficiencia,

              Actividades =
                @Actividades,

              FechaInicio =
                @FechaInicio,

              FechaFin =
                @FechaFin,

              Cargo =
                @Cargo,

              Contacto =
                @Contacto,

              Recursos =
                @Recursos,

              Entregable =
                @Entregable

            WHERE
              ActorUserId =
                @ActorUserId

              AND NumeroPregunta =
                @NumeroPregunta

              AND Estado = 0;

          END

          ELSE

          BEGIN

            INSERT INTO
              dbo.PlanAccionSAdministrativo
            (
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
              FechaRegistro,
              ActorUserId,
              Estado
            )

            VALUES
            (
              @PeriodoInicio,
              @PeriodoFin,
              @NumeroPregunta,
              @DescripcionPregunta,
              @Clasificacion,
              @Nivel,
              @Deficiencia,
              @Actividades,
              @FechaInicio,
              @FechaFin,
              @Cargo,
              @Contacto,
              @Recursos,
              @Entregable,
              GETDATE(),
              @ActorUserId,
              0
            );

          END
        `);
      }


      // ========================================================
      // 7. CONFIRMAR TRANSACCIÓN
      // ========================================================

      await transaction.commit();


      return NextResponse.json({
        ok: true,
        message:
          "Borrador guardado correctamente.",
      });

    } catch (error) {

      await transaction.rollback();

      throw error;
    }

  } catch (error: unknown) {

    console.error(
      "ERROR GUARDANDO BORRADOR:",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el borrador.",
      },
      {
        status: 500,
      }
    );
  }
}