import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    // ============================================================
    // 1. USUARIO AUTENTICADO
    // ============================================================

    const currentUser =
      await getCurrentUser();

    if (!currentUser?.userId) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const pool = await getPool();

    // ============================================================
    // 2. ROL DEL USUARIO
    // ============================================================

    const roleKey = String(
      currentUser.roleKey ?? ""
    )
      .trim()
      .toLowerCase();

    const roleName = String(
      currentUser.role ?? ""
    )
      .trim()
      .toLowerCase();

    const puedeVerTodo =
      roleKey === "administrador" ||
      roleKey === "subadministrador" ||
      roleName === "administrador" ||
      roleName === "subadministrador";

    console.log(
      "USUARIO CUMPLIMIENTO:",
      currentUser.userId
    );

    console.log(
      "ROL CUMPLIMIENTO:",
      roleKey,
      roleName
    );

    console.log(
      "PUEDE VER TODO:",
      puedeVerTodo
    );

    // ============================================================
    // 3. ADMINISTRADOR / SUBADMINISTRADOR
    //    VEN TODOS LOS PRINCIPIOS
    // ============================================================

    if (puedeVerTodo) {
      const result = await pool
        .request()
        .query(`
          WITH Detalle AS (
            SELECT
              TRY_CAST(
                LEFT(
                  Numero,
                  CHARINDEX('.', Numero + '.') - 1
                )
                AS INT
              ) AS PrincipioNumero,

              TRY_CAST(
                Calificacion
                AS DECIMAL(10,2)
              ) AS Calificacion

            FROM dbo.EvaluacionesPrincipioDetalleDGCI
          )

          SELECT
            p.PrincipioId,
            p.PrincipioTitulo,
            p.PreguntaGeneralNumero,
            p.PreguntaGeneralTexto,

            COUNT(d.Calificacion)
              AS TotalPreguntas,

            ISNULL(
              SUM(d.Calificacion),
              0
            ) AS SumaCalificacion,

            CAST(
              CASE
                WHEN COUNT(d.Calificacion) = 0
                  THEN 0
                ELSE
                  SUM(d.Calificacion) * 1.0
                  / COUNT(d.Calificacion)
              END
              AS DECIMAL(10,2)
            ) AS Promedio

          FROM dbo.EvaluacionesPrincipioDGCI AS p

          LEFT JOIN Detalle AS d
            ON d.PrincipioNumero =
              TRY_CAST(
                REPLACE(
                  p.PreguntaGeneralNumero,
                  '.',
                  ''
                )
                AS INT
              )

          GROUP BY
            p.PrincipioId,
            p.PrincipioTitulo,
            p.PreguntaGeneralNumero,
            p.PreguntaGeneralTexto

          ORDER BY
            TRY_CAST(
              REPLACE(
                p.PreguntaGeneralNumero,
                '.',
                ''
              )
              AS INT
            );
        `);

      console.log(
        "CUMPLIMIENTO COMPLETO:",
        result.recordset
      );

      return NextResponse.json(
        result.recordset
      );
    }

    // ============================================================
    // 4. OTROS USUARIOS
    //    SOLO PRINCIPIOS ASIGNADOS CON CanView = 1
    // ============================================================

    const result = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .query(`
        WITH Detalle AS (
          SELECT
            TRY_CAST(
              LEFT(
                Numero,
                CHARINDEX('.', Numero + '.') - 1
              )
              AS INT
            ) AS PrincipioNumero,

            TRY_CAST(
              Calificacion
              AS DECIMAL(10,2)
            ) AS Calificacion

          FROM dbo.EvaluacionesPrincipioDetalleDGCI
        )

        SELECT
          p.PrincipioId,
          p.PrincipioTitulo,
          p.PreguntaGeneralNumero,
          p.PreguntaGeneralTexto,

          COUNT(d.Calificacion)
            AS TotalPreguntas,

          ISNULL(
            SUM(d.Calificacion),
            0
          ) AS SumaCalificacion,

          CAST(
            CASE
              WHEN COUNT(d.Calificacion) = 0
                THEN 0
              ELSE
                SUM(d.Calificacion) * 1.0
                / COUNT(d.Calificacion)
            END
            AS DECIMAL(10,2)
          ) AS Promedio

        FROM dbo.EvaluacionesPrincipioDGCI AS p

        LEFT JOIN Detalle AS d
          ON d.PrincipioNumero =
            TRY_CAST(
              REPLACE(
                p.PreguntaGeneralNumero,
                '.',
                ''
              )
              AS INT
            )

        WHERE EXISTS (
          SELECT 1

          FROM dbo.usuariosPrincipiosPermisos AS upp

          WHERE
            upp.UserId = @UserId

            AND upp.PrincipioId =
              p.PrincipioId

            AND upp.CanView = 1
        )

        GROUP BY
          p.PrincipioId,
          p.PrincipioTitulo,
          p.PreguntaGeneralNumero,
          p.PreguntaGeneralTexto

        ORDER BY
          TRY_CAST(
            REPLACE(
              p.PreguntaGeneralNumero,
              '.',
              ''
            )
            AS INT
          );
      `);

    console.log(
      "CUMPLIMIENTO FILTRADO:",
      result.recordset
    );

    return NextResponse.json(
      result.recordset
    );
  } catch (error: unknown) {
    console.error(
      "ERROR API PRINCIPIOS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los principios.",
      },
      {
        status: 500,
      }
    );
  }
}