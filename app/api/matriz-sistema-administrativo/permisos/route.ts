import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.userId) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autenticado",
        },
        { status: 401 }
      );
    }

    const pool = await getPool();

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
            ISNULL(MAX(CAST(r.CanAddMatrixItems AS INT)), 0)
            AS BIT
          ) AS PuedeAgregar,

          CAST(
            ISNULL(MAX(CAST(r.CanEditMatrixItems AS INT)), 0)
            AS BIT
          ) AS PuedeEditar,

          CAST(
            ISNULL(MAX(CAST(r.CanDeleteMatrixItems AS INT)), 0)
            AS BIT
          ) AS PuedeEliminar,

          CAST(
            ISNULL(MAX(CAST(r.CanApproveResults AS INT)), 0)
            AS BIT
          ) AS PuedeAprobarResultados

        FROM dbo.UserRoles_Dgci AS ur
        INNER JOIN dbo.Roles_Dgci AS r
          ON r.RoleId = ur.RoleId

        WHERE ur.UserId = @UserId;
      `);

    const permisos = result.recordset[0];

    return NextResponse.json({
      ok: true,
      permisos: {
        puedeAgregar: Boolean(permisos?.PuedeAgregar),
        puedeEditar: Boolean(permisos?.PuedeEditar),
        puedeEliminar: Boolean(permisos?.PuedeEliminar),
        puedeAprobarResultados: Boolean(
          permisos?.PuedeAprobarResultados
        ),
      },
    });
  } catch (error: unknown) {
    console.error("Error obteniendo permisos:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron obtener los permisos.",
      },
      { status: 500 }
    );
  }
}