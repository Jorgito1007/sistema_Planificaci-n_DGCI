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
      "USUARIO RESPUESTAS COMPONENTES:",
      currentUser.userId
    );

    console.log(
      "ROL RESPUESTAS COMPONENTES:",
      roleKey,
      roleName
    );

    console.log(
      "PUEDE VER TODO:",
      puedeVerTodo
    );

    // ============================================================
    // 3. ADMINISTRADOR / SUBADMINISTRADOR
    //    VEN TODAS LAS RESPUESTAS
    // ============================================================

    if (puedeVerTodo) {
      const result = await pool
        .request()
        .query(`
          WITH Datos AS (
            SELECT
              TRY_CAST(
                LEFT(
                  Numero,
                  CHARINDEX('.', Numero + '.') - 1
                )
                AS INT
              ) AS Principio,

              EstaPresente,
              EstaFuncionando

            FROM dbo.EvaluacionesPrincipioDetalleDGCI
          ),

          Componentes AS (
            SELECT
              CASE
                WHEN Principio BETWEEN 1 AND 5 THEN 1
                WHEN Principio BETWEEN 6 AND 9 THEN 2
                WHEN Principio BETWEEN 10 AND 12 THEN 3
                WHEN Principio BETWEEN 13 AND 15 THEN 4
                WHEN Principio BETWEEN 16 AND 17 THEN 5
              END AS ComponenteId,

              COUNT(*) AS TotalPreguntas,

              SUM(
                CASE
                  WHEN EstaPresente = 'SI'
                    THEN 1
                  ELSE 0
                END
              ) AS TotalPresente,

              SUM(
                CASE
                  WHEN EstaFuncionando = 'SI'
                    THEN 1
                  ELSE 0
                END
              ) AS TotalFuncionando

            FROM Datos

            WHERE
              Principio BETWEEN 1 AND 17

            GROUP BY
              CASE
                WHEN Principio BETWEEN 1 AND 5 THEN 1
                WHEN Principio BETWEEN 6 AND 9 THEN 2
                WHEN Principio BETWEEN 10 AND 12 THEN 3
                WHEN Principio BETWEEN 13 AND 15 THEN 4
                WHEN Principio BETWEEN 16 AND 17 THEN 5
              END
          )

          SELECT
            ComponenteId,
            TotalPreguntas,
            TotalPresente,
            TotalFuncionando,

            CAST(
              TotalPresente * 100.0
              / NULLIF(TotalPreguntas, 0)
              AS DECIMAL(10,2)
            ) AS PorcentajePresente,

            CAST(
              TotalFuncionando * 100.0
              / NULLIF(TotalPreguntas, 0)
              AS DECIMAL(10,2)
            ) AS PorcentajeFuncionando

          FROM Componentes

          ORDER BY ComponenteId;
        `);

      console.log(
        "RESPUESTAS COMPONENTES COMPLETAS:",
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
        WITH Datos AS (
          SELECT
            TRY_CAST(
              LEFT(
                d.Numero,
                CHARINDEX('.', d.Numero + '.') - 1
              )
              AS INT
            ) AS Principio,

            d.EstaPresente,
            d.EstaFuncionando

          FROM dbo.EvaluacionesPrincipioDetalleDGCI AS d

          WHERE
            d.Numero IS NOT NULL

            AND EXISTS (
              SELECT 1

              FROM dbo.usuariosPrincipiosPermisos AS upp

              WHERE
                upp.UserId = @UserId

                AND upp.CanView = 1

                AND upp.PrincipioId =
                  TRY_CAST(
                    LEFT(
                      d.Numero,
                      CHARINDEX('.', d.Numero + '.') - 1
                    )
                    AS INT
                  )
            )
        ),

        Componentes AS (
          SELECT
            CASE
              WHEN Principio BETWEEN 1 AND 5 THEN 1
              WHEN Principio BETWEEN 6 AND 9 THEN 2
              WHEN Principio BETWEEN 10 AND 12 THEN 3
              WHEN Principio BETWEEN 13 AND 15 THEN 4
              WHEN Principio BETWEEN 16 AND 17 THEN 5
            END AS ComponenteId,

            COUNT(*) AS TotalPreguntas,

            SUM(
              CASE
                WHEN EstaPresente = 'SI'
                  THEN 1
                ELSE 0
              END
            ) AS TotalPresente,

            SUM(
              CASE
                WHEN EstaFuncionando = 'SI'
                  THEN 1
                ELSE 0
              END
            ) AS TotalFuncionando

          FROM Datos

          WHERE
            Principio BETWEEN 1 AND 17

          GROUP BY
            CASE
              WHEN Principio BETWEEN 1 AND 5 THEN 1
              WHEN Principio BETWEEN 6 AND 9 THEN 2
              WHEN Principio BETWEEN 10 AND 12 THEN 3
              WHEN Principio BETWEEN 13 AND 15 THEN 4
              WHEN Principio BETWEEN 16 AND 17 THEN 5
            END
        )

        SELECT
          ComponenteId,
          TotalPreguntas,
          TotalPresente,
          TotalFuncionando,

          CAST(
            TotalPresente * 100.0
            / NULLIF(TotalPreguntas, 0)
            AS DECIMAL(10,2)
          ) AS PorcentajePresente,

          CAST(
            TotalFuncionando * 100.0
            / NULLIF(TotalPreguntas, 0)
            AS DECIMAL(10,2)
          ) AS PorcentajeFuncionando

        FROM Componentes

        ORDER BY ComponenteId;
      `);

    console.log(
      "RESPUESTAS COMPONENTES FILTRADAS:",
      result.recordset
    );

    return NextResponse.json(
      result.recordset
    );
  } catch (error: unknown) {
    console.error(
      "ERROR API RESPUESTAS COMPONENTES:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener las respuestas.",
      },
      {
        status: 500,
      }
    );
  }
}