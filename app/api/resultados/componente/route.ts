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
    // 2. ROL
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
      "USUARIO COMPONENTES:",
      currentUser.userId
    );

    console.log(
      "ROL COMPONENTES:",
      roleKey,
      roleName
    );

    console.log(
      "PUEDE VER TODO:",
      puedeVerTodo
    );

    // ============================================================
    // 3. ADMINISTRADOR / SUBADMINISTRADOR
    //    VEN TODOS LOS COMPONENTES
    // ============================================================

    if (puedeVerTodo) {
      const result = await pool
        .request()
        .query(`
          SELECT
            CASE
              WHEN Principio BETWEEN 1 AND 5 THEN 1
              WHEN Principio BETWEEN 6 AND 9 THEN 2
              WHEN Principio BETWEEN 10 AND 12 THEN 3
              WHEN Principio BETWEEN 13 AND 15 THEN 4
              WHEN Principio BETWEEN 16 AND 17 THEN 5
            END AS ComponenteId,

            CASE
              WHEN Principio BETWEEN 1 AND 5
                THEN 'Entorno de Control'

              WHEN Principio BETWEEN 6 AND 9
                THEN 'Evaluación de Riesgos'

              WHEN Principio BETWEEN 10 AND 12
                THEN 'Actividades de Control'

              WHEN Principio BETWEEN 13 AND 15
                THEN 'Información y comunicación'

              WHEN Principio BETWEEN 16 AND 17
                THEN 'Supervisión - Monitoreo'
            END AS Componente,

            COUNT(*) AS TotalPreguntas,

            SUM(Calificacion)
              AS SumaCalificacion,

            CAST(
              SUM(Calificacion) * 1.0
              / NULLIF(COUNT(*), 0)
              AS DECIMAL(10,2)
            ) AS Promedio,

            '' AS Responsables

          FROM (
            SELECT
              CAST(
                LEFT(
                  Numero,
                  CHARINDEX('.', Numero) - 1
                )
                AS INT
              ) AS Principio,

              Calificacion

            FROM dbo.EvaluacionesPrincipioDetalleDGCI

            WHERE
              Numero IS NOT NULL
              AND CHARINDEX('.', Numero) > 0
          ) AS D

          GROUP BY
            CASE
              WHEN Principio BETWEEN 1 AND 5 THEN 1
              WHEN Principio BETWEEN 6 AND 9 THEN 2
              WHEN Principio BETWEEN 10 AND 12 THEN 3
              WHEN Principio BETWEEN 13 AND 15 THEN 4
              WHEN Principio BETWEEN 16 AND 17 THEN 5
            END,

            CASE
              WHEN Principio BETWEEN 1 AND 5
                THEN 'Entorno de Control'

              WHEN Principio BETWEEN 6 AND 9
                THEN 'Evaluación de Riesgos'

              WHEN Principio BETWEEN 10 AND 12
                THEN 'Actividades de Control'

              WHEN Principio BETWEEN 13 AND 15
                THEN 'Información y comunicación'

              WHEN Principio BETWEEN 16 AND 17
                THEN 'Supervisión - Monitoreo'
            END

          ORDER BY ComponenteId;
        `);

      return NextResponse.json(
        result.recordset
      );
    }

    // ============================================================
    // 4. DEMÁS USUARIOS
    //    SOLO PRINCIPIOS CON CanView = 1
    // ============================================================

    const result = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .input(
        "FullName",
        sql.NVarChar(200),
        currentUser.full_name
      )
      .query(`
        SELECT
          CASE
            WHEN Principio BETWEEN 1 AND 5 THEN 1
            WHEN Principio BETWEEN 6 AND 9 THEN 2
            WHEN Principio BETWEEN 10 AND 12 THEN 3
            WHEN Principio BETWEEN 13 AND 15 THEN 4
            WHEN Principio BETWEEN 16 AND 17 THEN 5
          END AS ComponenteId,

          CASE
            WHEN Principio BETWEEN 1 AND 5
              THEN 'Entorno de Control'

            WHEN Principio BETWEEN 6 AND 9
              THEN 'Evaluación de Riesgos'

            WHEN Principio BETWEEN 10 AND 12
              THEN 'Actividades de Control'

            WHEN Principio BETWEEN 13 AND 15
              THEN 'Información y comunicación'

            WHEN Principio BETWEEN 16 AND 17
              THEN 'Supervisión - Monitoreo'
          END AS Componente,

          COUNT(*) AS TotalPreguntas,

          SUM(Calificacion)
            AS SumaCalificacion,

          CAST(
            SUM(Calificacion) * 1.0
            / NULLIF(COUNT(*), 0)
            AS DECIMAL(10,2)
          ) AS Promedio,

          @FullName AS Responsables

        FROM
        (
          SELECT
            CAST(
              LEFT(
                d.Numero,
                CHARINDEX('.', d.Numero) - 1
              )
              AS INT
            ) AS Principio,

            d.Calificacion

          FROM dbo.EvaluacionesPrincipioDetalleDGCI AS d

          WHERE
            d.Numero IS NOT NULL

            AND CHARINDEX(
              '.',
              d.Numero
            ) > 0

            AND EXISTS
            (
              SELECT 1

              FROM dbo.usuariosPrincipiosPermisos AS upp

              WHERE
                upp.UserId = @UserId

                AND upp.CanView = 1

                AND upp.PrincipioId =
                  CAST(
                    LEFT(
                      d.Numero,
                      CHARINDEX('.', d.Numero) - 1
                    )
                    AS INT
                  )
            )
        ) AS D

        GROUP BY
          CASE
            WHEN Principio BETWEEN 1 AND 5 THEN 1
            WHEN Principio BETWEEN 6 AND 9 THEN 2
            WHEN Principio BETWEEN 10 AND 12 THEN 3
            WHEN Principio BETWEEN 13 AND 15 THEN 4
            WHEN Principio BETWEEN 16 AND 17 THEN 5
          END,

          CASE
            WHEN Principio BETWEEN 1 AND 5
              THEN 'Entorno de Control'

            WHEN Principio BETWEEN 6 AND 9
              THEN 'Evaluación de Riesgos'

            WHEN Principio BETWEEN 10 AND 12
              THEN 'Actividades de Control'

            WHEN Principio BETWEEN 13 AND 15
              THEN 'Información y comunicación'

            WHEN Principio BETWEEN 16 AND 17
              THEN 'Supervisión - Monitoreo'
          END

        ORDER BY ComponenteId;
      `);

    console.log(
      "RESULTADOS COMPONENTES FILTRADOS:",
      result.recordset
    );

    return NextResponse.json(
      result.recordset
    );
  } catch (error: unknown) {
    console.error(
      "ERROR API COMPONENTES:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener los resultados.",
      },
      {
        status: 500,
      }
    );
  }
}