import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { sendMail } from "@/lib/sendMail";

export async function POST(
  req: Request
) {
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
            "No se pudo obtener el usuario autenticado.",
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
      !periodoInicio ||
      !periodoFin
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe indicar el período del Plan de Acción.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(filas) ||
      filas.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No existen registros para enviar.",
        },
        {
          status: 400,
        }
      );
    }

    const pool =
      await getPool();

    // ============================================================
    // 3. VERIFICAR QUE NO ESTÉ ENVIADO
    // ============================================================

    const enviado =
      await pool
        .request()
        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )
        .query(`
          SELECT TOP 1 Id
          FROM dbo.PlanAccionSPorComponentes
          WHERE
            ActorUserId = @ActorUserId
            AND Estado = 1;
        `);

    if (
      enviado.recordset.length >
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El Plan de Acción ya fue enviado anteriormente.",
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
            periodoInicio
          )
          .input(
            "PeriodoFin",
            sql.Date,
            periodoFin
          )
          .input(
            "NumeroPregunta",
            sql.VarChar(50),
            fila.numeroPregunta
          )
          .input(
            "DescripcionPregunta",
            sql.NVarChar(sql.MAX),
            fila.descripcionPregunta
          )
          .input(
            "Clasificacion",
            sql.Int,
            Number(
              fila.clasificacion
            )
          )
          .input(
            "Nivel",
            sql.VarChar(50),
            fila.nivel
          )
          .input(
            "Deficiencia",
            sql.NVarChar(sql.MAX),
            fila.deficiencia
          )
          .input(
            "Actividades",
            sql.NVarChar(sql.MAX),
            fila.actividades
          )
          .input(
            "FechaInicio",
            sql.Date,
            fila.fechaInicio
          )
          .input(
            "FechaFin",
            sql.Date,
            fila.fechaFin
          )
          .input(
            "Cargo",
            sql.NVarChar(200),
            fila.cargo
          )
          .input(
            "Contacto",
            sql.NVarChar(200),
            fila.contacto
          )
          .input(
            "Recursos",
            sql.NVarChar(sql.MAX),
            fila.recursos
          )
          .input(
            "Entregable",
            sql.NVarChar(sql.MAX),
            fila.entregable
          )
          .input(
            "ActorUserId",
            sql.UniqueIdentifier,
            actorUserId
          );

        await request.query(`
          IF EXISTS (
            SELECT 1
            FROM dbo.PlanAccionSPorComponentes
            WHERE
              ActorUserId =
                @ActorUserId
              AND NumeroPregunta =
                @NumeroPregunta
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
                @Entregable,

              Estado = 1

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
              1
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
    // 5. DATOS DEL USUARIO
    // ============================================================

    const userResult =
      await pool
        .request()
        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )
        .query(`
          SELECT
            FullName
          FROM dbo.Usuarios_Dgci
          WHERE
            UserId = @ActorUserId;
        `);

    const nombreUsuario =
      userResult.recordset[0]
        ?.FullName ||
      "Usuario no identificado";

    // ============================================================
    // 6. CORREOS COPIA
    // ============================================================

    const correosCopia:
      string[] =
      process.env
        .CORREOS_COPIA_DGCI
        ? process.env
            .CORREOS_COPIA_DGCI
            .split(",")
            .map((correo) =>
              correo.trim()
            )
            .filter(Boolean)
        : [];

    // ============================================================
    // 7. CORREO
    // ============================================================

    try {
      await sendMail({
        to:
          process.env
            .DIRECTOR_EMAIL!,

        cc: correosCopia,

        subject:
          "Nuevo Plan de Acción por Componentes",

        html: `
          <div style="font-family: Arial, sans-serif;">

            <div style="text-align:center;">
              <img
                width="400"
                height="97"
                src="https://nuevoingreso.uncsm.edu.ni/img/logo-color.png"
              />
            </div>

            <p>
              <strong>
                Estimado(a)s:
              </strong>
            </p>

            <p>
              El usuario
              <strong>
                ${nombreUsuario}
              </strong>
              ha enviado un nuevo Plan de Acción
              por Componentes para su validación.
            </p>

            <p>
              <strong>Período:</strong>
              ${periodoInicio}
              al
              ${periodoFin}
            </p>

            <p>
              <strong>
                Total de registros:
              </strong>
              ${filas.length}
            </p>

            <p>
              <strong>Fecha:</strong>
              ${new Date().toLocaleString(
                "es-NI"
              )}
            </p>

            <br/>

            <p>
              No es necesario responder este correo.
            </p>

            <p>
              Universidad Nacional Casimiro Sotelo Montenegro
            </p>

            <p>
              <i>
                ¡Revolucionando la Conciencia,
                Llegamos a la Libertad!
              </i>
            </p>

          </div>
        `,
      });

      console.log(
        "Correo enviado correctamente"
      );

    } catch (error) {
      console.error(
        "El Plan fue enviado, pero ocurrió un error enviando el correo:",
        error
      );
    }

    // ============================================================
    // 8. RESPUESTA
    // ============================================================

    return NextResponse.json({
      ok: true,

      message:
        "Plan de Acción enviado correctamente.",

      estado: 1,
    });

  } catch (error: any) {
    console.error(
      "ERROR ENVIANDO PLAN DE ACCIÓN POR COMPONENTES:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error.message ||
          "No se pudo enviar el Plan de Acción.",
      },
      {
        status: 500,
      }
    );
  }
}