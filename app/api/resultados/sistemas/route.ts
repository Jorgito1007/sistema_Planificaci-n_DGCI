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
      "USUARIO RESULTADOS:",
      currentUser.userId
    );

    console.log(
      "ROL RESULTADOS:",
      roleKey,
      roleName
    );

    console.log(
      "PUEDE VER TODO:",
      puedeVerTodo
    );

    // ============================================================
    // 3. ADMINISTRADOR / SUBADMINISTRADOR
    // ============================================================


//    VEN TODOS LOS RESULTADOS
//    PERO NO SE MUESTRA "ELABORADO POR"
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

        COUNT(*) AS TotalPreguntas,

        SUM(Calificacion)
          AS SumaCalificacion,

        CAST(
          SUM(Calificacion) * 1.0
          / NULLIF(COUNT(*), 0)
          AS DECIMAL(10,2)
        ) AS Promedio

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

  // Para Administrador y Subadministrador
  // Responsables siempre queda vacío.
  const resultados =
    result.recordset.map(
      (item: any) => ({
        ...item,
        Responsables: "",
      })
    );

  console.log(
    "RESULTADOS COMPLETOS ADMIN:",
    resultados
  );

  return NextResponse.json(
    resultados
  );
}   // ============================================================
    // 4. OTROS ROLES
    // SOLO PREGUNTAS ASIGNADAS AL USUARIO
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
          CAST(
            LEFT(
              d.Numero,
              CHARINDEX('.', d.Numero) - 1
            )
            AS INT
          ) AS Sistema,

          COUNT(*) AS TotalPreguntas,

          SUM(d.Calificacion)
            AS SumaCalificacion,

          CAST(
            SUM(d.Calificacion) * 1.0
            / NULLIF(COUNT(*), 0)
            AS DECIMAL(10,2)
          ) AS Promedio,

          @FullName AS Responsables

        FROM dbo.Matriz_SistemaAdministrativoDetalle AS d

        WHERE
          d.Numero IS NOT NULL

          AND CHARINDEX(
            '.',
            d.Numero
          ) > 0

          AND EXISTS (
            SELECT 1
            FROM dbo.usuariosPreguntasPermisos AS upp
            WHERE
              upp.UserId = @UserId
              AND upp.QuestionId = d.Id
              AND upp.CanView = 1
          )

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
      "RESULTADOS FILTRADOS:",
      result.recordset
    );

    return NextResponse.json(
      result.recordset
    );
  } catch (error: unknown) {
    console.error(
      "ERROR API RESULTADOS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los resultados.",
      },
      {
        status: 500,
      }
    );
  }
}