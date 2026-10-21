import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPool } from "@/lib/db";

// ============================================================
// GET USUARIOS
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // SESIÓN AUTH.JS
    // ========================================================

    const session = await auth();



    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // VALIDAR ADMINISTRADOR
    // ========================================================

    const role = String(
      (session.user as any)?.role || ""
    )
      .trim()
      .toLowerCase();

    if (role !== "administrador") {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // CONSULTAR USUARIOS
    // ========================================================

    const pool =
      await getPool();

    const result =
      await pool.request().query(`
        SELECT
          CAST(
            u.UserId AS nvarchar(36)
          ) AS id,

          u.Email AS email,

          u.FullName AS full_name,

          u.Cargo AS cargo,

          r.RoleKey AS role,

          u.IsActive AS is_active

        FROM dbo.Usuarios_Dgci u

        LEFT JOIN dbo.UserRoles_Dgci ur
          ON ur.UserId = u.UserId

        LEFT JOIN dbo.Roles_Dgci r
          ON r.RoleId = ur.RoleId

        ORDER BY
          u.Email;
      `);

    return NextResponse.json({
      users:
        result.recordset,
    });

  } catch (error: any) {
    console.error(
      "ERROR GET /api/admin/users:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error al cargar usuarios",

        detail:
          error?.message ||
          String(error),
      },
      {
        status: 500,
      }
    );
  }
}