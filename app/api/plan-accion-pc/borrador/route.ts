import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

export async function POST(req: Request) {
  try {
    // ============================================================
    // 1. USUARIO
    // ============================================================

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
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

    // ============================================================
    // 2. BODY
    // ============================================================

    const body =
      await req.json();

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

    const pool =
      await getPool();

    // ============================================================
    // 3. VERIFICAR SI YA FUE ENVIADO
    // ============================================================

    const enviadoResult =
      await pool
        .request()
        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )
        .query(`
          SELECT TOP 1
            Id
          FROM dbo.PlanAccionSPorComponentes
          WHERE
            ActorUserId = @ActorUserId
            AND Estado = 1;
        `);

    if (
      enviadoResult.recordset
        .length > 0
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

    // ============================================================
    // 4. TRANSACCIÓN
    // ============================================================

    const transaction =
      new sql.Transaction(pool);

    await transaction.begin();

    try {
      for (const fila of filas) {

        const request =
          new sql.Request(
            transaction
          );

        request
          .input(
            "PeriodoInicio",
            sql.Date,
            periodoInicio || null
          )
          .input(
            "PeriodoFin",
            sql.Date,
            periodoFin || null
          )
          .input(
            "NumeroPregunta",
            sql.VarChar(50),
            fila.numeroPregunta
          )
          .input(
            "DescripcionPregunta",
            sql.NVarChar(sql.MAX),
            fila.descripcionPregunta ||
              ""
          )
          .input(
            "Clasificacion",
            sql.Int,
            Number(
              fila.clasificacion ||
                0
            )
          )
          .input(
            "Nivel",
            sql.VarChar(50),
            fila.nivel || ""
          )
          .input(
            "Deficiencia",
            sql.NVarChar(sql.MAX),
            fila.deficiencia ||
              ""
          )
          .input(
            "Actividades",
            sql.NVarChar(sql.MAX),
            fila.actividades ||
              ""
          )
          .input(
            "FechaInicio",
            sql.Date,
            fila.fechaInicio ||
              null
          )
          .input(
            "FechaFin",
            sql.Date,
            fila.fechaFin ||
              null
          )
          .input(
            "Cargo",
            sql.NVarChar(200),
            fila.cargo || ""
          )
          .input(
            "Contacto",
            sql.NVarChar(200),
            fila.contacto || ""
          )
          .input(
            "Recursos",
            sql.NVarChar(sql.MAX),
            fila.recursos || ""
          )
          .input(
            "Entregable",
            sql.NVarChar(sql.MAX),
            fila.entregable || ""
          )
          .input(
            "ActorUserId",
            sql.UniqueIdentifier,
            actorUserId
          );

        // ========================================================
        // UPDATE SI YA EXISTE
        // INSERT SI NO EXISTE
        // ========================================================

        await request.query(`
          IF EXISTS (
            SELECT 1
            FROM dbo.PlanAccionSPorComponentes
            WHERE
              ActorUserId = @ActorUserId
              AND NumeroPregunta = @NumeroPregunta
              AND Estado = 0
          )
          BEGIN

            UPDATE dbo.PlanAccionSPorComponentes

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

            INSERT INTO dbo.PlanAccionSPorComponentes
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
              @ActorUserId,
              0
            );

          END
        `);
      }

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // ============================================================
    // 5. RESPUESTA
    // ============================================================

    return NextResponse.json({
      ok: true,
      message:
        "Borrador guardado correctamente.",
    });

  } catch (error: any) {
    console.error(
      "ERROR GUARDANDO BORRADOR COMPONENTES:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo guardar el borrador.",
      },
      {
        status: 500,
      }
    );
  }
}