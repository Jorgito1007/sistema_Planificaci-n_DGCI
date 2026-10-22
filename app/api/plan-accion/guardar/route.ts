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

import {
  sendMail,
} from "@/lib/sendMail";


// ============================================================
// POST
// ENVÍO DEFINITIVO DEL PLAN DE ACCIÓN
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
            "No se pudo obtener el usuario autenticado.",
        },
        {
          status: 401,
        }
      );
    }


    // ==========================================================
    // 2. BODY
    // ==========================================================

    const body =
      await req.json();


    const {
      periodoInicio,
      periodoFin,
      filas,
    } = body;


    // ==========================================================
    // 3. VALIDACIONES GENERALES
    // ==========================================================

    if (
      !periodoInicio ||
      !periodoFin
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe completar el período del Plan de Acción.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      new Date(periodoInicio) >
      new Date(periodoFin)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "La fecha de inicio del período no puede ser posterior a la fecha de fin.",
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


    // ==========================================================
    // 4. VALIDAR TODAS LAS FILAS EN BACKEND
    // ==========================================================
    // Aunque el frontend ya valida, también debemos proteger
    // el endpoint directamente.
    // ==========================================================

    for (
      let i = 0;
      i < filas.length;
      i++
    ) {

      const fila = filas[i];


      const camposObligatorios = [
        {
          key: "numeroPregunta",
          label: "Número de pregunta",
        },
        {
          key: "descripcionPregunta",
          label: "Descripción",
        },
        {
          key: "clasificacion",
          label: "Clasificación",
        },
        {
          key: "nivel",
          label: "Nivel",
        },
        {
          key: "deficiencia",
          label: "Deficiencia",
        },
        {
          key: "actividades",
          label: "Actividades",
        },
        {
          key: "fechaInicio",
          label: "Fecha Inicio",
        },
        {
          key: "fechaFin",
          label: "Fecha Fin",
        },
        {
          key: "responsable",
          label: "Responsable",
        },
        {
          key: "cargo",
          label: "Cargo",
        },
        {
          key: "contacto",
          label: "Contacto",
        },
        {
          key: "recursos",
          label: "Recursos",
        },
        {
          key: "entregable",
          label: "Entregable",
        },
      ];


      for (
        const campo
        of camposObligatorios
      ) {

        const valor =
          fila[campo.key];


        if (
          valor === null ||
          valor === undefined ||
          String(valor).trim() === ""
        ) {

          return NextResponse.json(
            {
              ok: false,

              message:
                `Debe completar el campo "${campo.label}" en la pregunta ${fila.numeroPregunta || i + 1}.`,
            },
            {
              status: 400,
            }
          );
        }
      }


      // ========================================================
      // VALIDAR RANGO DE CALIFICACIÓN
      // Solo deberían enviarse preguntas entre 1 y 4.
      // ========================================================

      const clasificacion =
        Number(
          fila.clasificacion
        );


      if (
        Number.isNaN(
          clasificacion
        ) ||
        clasificacion < 1 ||
        clasificacion > 4
      ) {

        return NextResponse.json(
          {
            ok: false,

            message:
              `La clasificación de la pregunta ${fila.numeroPregunta} no es válida para el Plan de Acción.`,
          },
          {
            status: 400,
          }
        );
      }


      // ========================================================
      // VALIDAR FECHAS DE LA ACTIVIDAD
      // ========================================================

      if (
        new Date(
          fila.fechaInicio
        ) >
        new Date(
          fila.fechaFin
        )
      ) {

        return NextResponse.json(
          {
            ok: false,

            message:
              `La fecha de inicio no puede ser posterior a la fecha de fin en la pregunta ${fila.numeroPregunta}.`,
          },
          {
            status: 400,
          }
        );
      }
    }


    // ==========================================================
    // 5. CONEXIÓN
    // ==========================================================

    const pool =
      await getPool();


    // ==========================================================
    // 6. VERIFICAR SI EL PLAN YA FUE ENVIADO
    // ==========================================================
    // Si encontramos Estado = 1 para este usuario,
    // no permitimos otro envío.
    // ==========================================================

    const planYaEnviado =
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
          FROM
            dbo.PlanAccionSAdministrativo

          WHERE
            ActorUserId =
              @ActorUserId

            AND
            Estado = 1;
        `);


    if (
      planYaEnviado.recordset.length > 0
    ) {

      return NextResponse.json(
        {
          ok: false,

          message:
            "El Plan de Acción ya fue enviado anteriormente y se encuentra cerrado.",
        },
        {
          status: 409,
        }
      );
    }


    // ==========================================================
    // 7. INICIAR TRANSACCIÓN
    // ==========================================================

    const transaction =
      new sql.Transaction(pool);


    await transaction.begin();


    try {

      // ========================================================
      // 8. GUARDAR / ACTUALIZAR CADA FILA
      // ========================================================

      for (
        const fila
        of filas
      ) {

        const request =
          new sql.Request(
            transaction
          );


        request.input(
          "PeriodoInicio",
          sql.Date,
          periodoInicio
        );


        request.input(
          "PeriodoFin",
          sql.Date,
          periodoFin
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
          sql.NVarChar(
            sql.MAX
          ),
          fila.descripcionPregunta
        );


        request.input(
          "Clasificacion",
          sql.Int,
          Number(
            fila.clasificacion
          )
        );


        request.input(
          "Nivel",
          sql.VarChar(50),
          fila.nivel
        );


        request.input(
          "Deficiencia",
          sql.NVarChar(
            sql.MAX
          ),
          fila.deficiencia
        );


        request.input(
          "Actividades",
          sql.NVarChar(
            sql.MAX
          ),
          fila.actividades
        );


        request.input(
          "FechaInicio",
          sql.Date,
          fila.fechaInicio
        );


        request.input(
          "FechaFin",
          sql.Date,
          fila.fechaFin
        );


        request.input(
          "Cargo",
          sql.NVarChar(200),
          fila.cargo
        );


        request.input(
          "Contacto",
          sql.NVarChar(200),
          fila.contacto
        );


        request.input(
          "Recursos",
          sql.NVarChar(
            sql.MAX
          ),
          fila.recursos
        );


        request.input(
          "Entregable",
          sql.NVarChar(
            sql.MAX
          ),
          fila.entregable
        );


        request.input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        );


        // ======================================================
        // SI EXISTE BORRADOR:
        // UPDATE + Estado = 1
        //
        // SI NO EXISTE:
        // INSERT DIRECTAMENTE COMO ENVIADO
        //
        // Esto permite enviar aunque el usuario nunca haya
        // presionado Guardar previamente.
        // ======================================================

        await request.query(`

          IF EXISTS
          (
            SELECT 1

            FROM
              dbo.PlanAccionSAdministrativo

            WHERE
              ActorUserId =
                @ActorUserId

              AND
              NumeroPregunta =
                @NumeroPregunta

              AND
              Estado = 0
          )

          BEGIN

            UPDATE
              dbo.PlanAccionSAdministrativo

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

              AND
              NumeroPregunta =
                @NumeroPregunta

              AND
              Estado = 0;

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
              1
            );

          END

        `);
      }


      // ========================================================
      // 9. CONFIRMAR TRANSACCIÓN
      // ========================================================

      await transaction.commit();

    } catch (error) {

      // ========================================================
      // SI ALGO FALLA, NO CERRAMOS NINGÚN REGISTRO
      // ========================================================

      await transaction.rollback();

      throw error;
    }


    // ==========================================================
    // 10. OBTENER NOMBRE DEL USUARIO
    // ==========================================================

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
            FullName,
            Email

          FROM
            dbo.Usuarios_Dgci

          WHERE
            UserId =
              @ActorUserId;
        `);


    const nombreUsuario =
      userResult
        .recordset[0]
        ?.FullName ||

      userResult
        .recordset[0]
        ?.Email ||

      "Usuario no identificado";


    // ==========================================================
    // 11. CORREOS COPIA
    // ==========================================================

    const correosCopia:
      string[] =
      process.env
        .CORREOS_COPIA_DGCI

        ? process.env
            .CORREOS_COPIA_DGCI
            .split(",")
            .map(
              (correo) =>
                correo.trim()
            )
            .filter(Boolean)

        : [];


    // ==========================================================
    // 12. ENVIAR CORREO
    // ==========================================================
    // El plan ya fue guardado correctamente.
    // Si el correo falla, NO revertimos el Plan de Acción.
    // ==========================================================

    try {

      if (
        process.env
          .DIRECTOR_EMAIL
      ) {

        await sendMail({

          to:
            process.env
              .DIRECTOR_EMAIL,

          cc:
            correosCopia,

          subject:
            "Nuevo Plan de Acción Sistemas Administrativos",

          html: `
            <div
              style="
                font-family:
                  Arial,
                  sans-serif;
                color:#1e293b;
              "
            >

              <div
                style="
                  text-align:center;
                  margin-bottom:25px;
                "
              >

                <img
                  width="400"
                  height="97"
                  src="https://nuevoingreso.uncsm.edu.ni/img/logo-color.png"
                  alt="Universidad Nacional Casimiro Sotelo Montenegro"
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

                ha enviado un nuevo
                Plan de Acción de los
                Sistemas Administrativos
                para su validación.
              </p>


              <p>
                <strong>
                  Período:
                </strong>

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
                <strong>
                  Fecha de envío:
                </strong>

                ${new Date().toLocaleString(
                  "es-NI"
                )}
              </p>


              <br />


              <p>
                No es necesario responder
                este correo.
              </p>


              <p>
                Universidad Nacional
                Casimiro Sotelo Montenegro
              </p>


              <p>
                <i>
                  ¡Revolucionando la
                  Conciencia, Llegamos
                  a la Libertad!
                </i>
              </p>

            </div>
          `,
        });


        console.log(
          "Correo del Plan de Acción enviado correctamente."
        );
      }

    } catch (error) {

      console.error(
        "El Plan fue enviado, pero ocurrió un error enviando el correo:",
        error
      );
    }


    // ==========================================================
    // 13. RESPUESTA
    // ==========================================================

    return NextResponse.json({
      ok: true,

      message:
        "Plan de Acción enviado correctamente.",

      planEnviado:
        true,
    });


  } catch (error: unknown) {

    console.error(
      "ERROR ENVIANDO PLAN DE ACCIÓN:",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        message:
          "No se pudo enviar el Plan de Acción.",
      },
      {
        status: 500,
      }
    );
  }
}