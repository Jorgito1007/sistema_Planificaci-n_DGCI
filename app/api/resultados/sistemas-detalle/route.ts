import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    // ============================================================
    // 1. USUARIO AUTENTICADO
    // ============================================================

    const currentUser = await getCurrentUser();

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
    // 2. OBTENER ROL DEL USUARIO
    // ============================================================

    const rolResult = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .query(`
        SELECT TOP 1
          r.RoleKey,
          r.RoleName
        FROM dbo.UserRoles_Dgci AS ur

        INNER JOIN dbo.Roles_Dgci AS r
          ON r.RoleId = ur.RoleId

        WHERE ur.UserId = @UserId;
      `);

    const rol = rolResult.recordset[0];

    const roleKey = String(
      rol?.RoleKey ?? ""
    )
      .trim()
      .toLowerCase();

    const roleName = String(
      rol?.RoleName ?? ""
    )
      .trim()
      .toLowerCase();

    // ============================================================
    // 3. ADMINISTRADOR / SUBADMINISTRADOR
    // ============================================================

    const puedeVerTodo =
      roleKey === "administrador" ||
      roleKey === "subadministrador" ||
      roleName === "administrador" ||
      roleName === "subadministrador";

    console.log(
      "USUARIO SISTEMAS DETALLE:",
      currentUser.userId
    );

    console.log(
      "ROL SISTEMAS DETALLE:",
      roleKey,
      roleName
    );

    console.log(
      "PUEDE VER TODO SISTEMAS DETALLE:",
      puedeVerTodo
    );

    // ============================================================
    // 4. ADMINISTRADOR / SUBADMINISTRADOR
    //    VEN TODAS LAS PREGUNTAS
    // ============================================================

    if (puedeVerTodo) {
      const result = await pool
        .request()
        .query(`
          SELECT
            CAST(
              LEFT(
                Numero,
                CHARINDEX('.', Numero) - 1
              )
              AS INT
            ) AS Sistema,

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

          FROM dbo.Matriz_SistemaAdministrativoDetalle

          WHERE
            Numero IS NOT NULL
            AND CHARINDEX('.', Numero) > 0

          GROUP BY
            CAST(
              LEFT(
                Numero,
                CHARINDEX('.', Numero) - 1
              )
              AS INT
            )

          ORDER BY Sistema;
        `);

      console.log(
        "AFIRMATIVAS COMPLETAS:",
        result.recordset
      );

      return NextResponse.json(
        result.recordset
      );
    }

    // ============================================================
    // 5. OTROS ROLES
    //    SOLO PREGUNTAS ASIGNADAS
    // ============================================================

    const result = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )
      .query(`
        SELECT
          CAST(
            LEFT(
              d.Numero,
              CHARINDEX('.', d.Numero) - 1
            )
            AS INT
          ) AS Sistema,

          SUM(
            CASE
              WHEN d.EstaPresente = 'SI'
              THEN 1
              ELSE 0
            END
          ) AS TotalPresente,

          SUM(
            CASE
              WHEN d.EstaFuncionando = 'SI'
              THEN 1
              ELSE 0
            END
          ) AS TotalFuncionando

        FROM dbo.Matriz_SistemaAdministrativoDetalle AS d

        INNER JOIN dbo.usuariosPreguntasPermisos AS upp
          ON upp.QuestionId = d.Id

        WHERE
          upp.UserId = @UserId
          AND upp.CanView = 1

          AND d.Numero IS NOT NULL
          AND CHARINDEX('.', d.Numero) > 0

        GROUP BY
          CAST(
            LEFT(
              d.Numero,
              CHARINDEX('.', d.Numero) - 1
            )
            AS INT
          )

        ORDER BY Sistema;
      `);

    console.log(
      "AFIRMATIVAS FILTRADAS DEL USUARIO:",
      result.recordset
    );

    return NextResponse.json(
      result.recordset
    );
  } catch (error: unknown) {
    console.error(
      "ERROR API AFIRMATIVAS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los resultados afirmativos.",
      },
      {
        status: 500,
      }
    );
  }
}