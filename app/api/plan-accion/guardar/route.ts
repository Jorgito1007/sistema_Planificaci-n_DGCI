import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { sendMail } from "@/lib/sendMail";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      periodoInicio,
      periodoFin,
      filas,
    } = body;

    
    const pool = await getPool();

     const actorUserId = await getCurrentUserId();
    
        if (!actorUserId) {
          return NextResponse.json(
            { error: "No se pudo obtener el UserId del usuario autenticado" },
            { status: 401 }
          );
        }


    for (const fila of filas) {

      await pool.request()

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
          sql.VarChar,
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
          fila.clasificacion
        )

        .input(
          "Nivel",
          sql.VarChar,
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
          fila.fechaInicio || null
        )

        .input(
          "FechaFin",
          sql.Date,
          fila.fechaFin || null
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
)
        .query(`
          INSERT INTO PlanAccionSAdministrativo (

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
            ActorUserId

          )

          VALUES (

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
@actorUserId
          )
        `);

    }

const userResult = await pool
  .request()
  .input(
    "ActorUserId",
    sql.UniqueIdentifier,
    actorUserId
  )
  .query(`
    SELECT FullName
    FROM Usuarios_Dgci
    WHERE UserId = @ActorUserId
  `);

const nombreUsuario =
  userResult.recordset[0]?.FullName ||
  userResult.recordset[0]?.Email ||
  "Usuario no identificado";

// ======================================
// CORREOS COPIA
// ======================================

const correosCopia: string[] =
  process.env.CORREOS_COPIA_DGCI
    ? process.env.CORREOS_COPIA_DGCI
        .split(",")
        .map((correo) => correo.trim())
        .filter(Boolean)
    : [];

// ======================================
// ENVIAR CORREO
// ======================================

try {

  await sendMail({

    to: process.env.DIRECTOR_EMAIL!,

    cc: correosCopia,

    subject: `Nuevo Plan de Acción Sistemas Administrativos`,

    html: `
      <div style="font-family: Arial, sans-serif;">

        <div style="text-align:center;">
          <img
            width="400"
            height="97"
            src="https://nuevoingreso.uncsm.edu.ni/img/logo-color.png"
          />
        </div>

        <p><strong>Estimado(a)s:</strong></p>

        <p>
          El usuario
          <strong>${nombreUsuario}</strong>
          ha enviado un nuevo Plan de Acción para su validación.
        </p>

        <p>
          <strong>Período:</strong>
          ${periodoInicio} al ${periodoFin}
        </p>

        <p>
          <strong>Total de registros:</strong>
          ${filas.length}
        </p>

        <p>
          <strong>Fecha:</strong>
          ${new Date().toLocaleString("es-NI")}
        </p>

        <br />

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
    "Error enviando correo:",
    error
  );

}

    return NextResponse.json({
      ok: true,
      message:
        "Plan de acción guardado correctamente",
    });

  } catch (error: any) {

  console.error("ERROR COMPLETO:", error);

  return NextResponse.json({
    ok: false,
    message: error.message,
    error: error,
  });

}



}

