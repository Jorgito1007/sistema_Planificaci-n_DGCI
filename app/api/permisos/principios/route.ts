import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUserId,
  getCurrentUserFromToken,
} from "@/lib/current-user";

export async function GET(req: Request) {
  try {

    let actorUserId: string | null | undefined =
      await getCurrentUserId();

    if (!actorUserId) {
      const me = await getCurrentUserFromToken();

      actorUserId =
        me?.userId ||
        
        null;
    }

    if (!actorUserId) {
      return NextResponse.json(
        {
          error:
            "No se pudo obtener el UserId del usuario autenticado",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const subModuleKey =
      searchParams.get("subModuleKey");

    if (!subModuleKey) {
      return NextResponse.json(
        { error: "Falta subModuleKey" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const roleResult = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        SELECT TOP 1
          LOWER(LTRIM(RTRIM(r.RoleKey))) AS RoleKey
        FROM dbo.UserRoles_Dgci ur
        INNER JOIN dbo.Roles_Dgci r
          ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId
      `);

    const role = String(
      roleResult.recordset[0]?.RoleKey || ""
    );

    if (
      role === "administrador" ||
      role === "subadministrador"
    ) {
      return NextResponse.json({
        ok: true,
        role,
        isFullAccess: true,
        principios: [],
      });
    }

    const permisos = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .input(
        "SubModuleKey",
        sql.VarChar(100),
        subModuleKey
      )
      .query(`
        SELECT
          upp.PrincipioId,
          upp.CanView,
          upp.CanCreate,
          upp.CanEdit,
          upp.CanDelete
        FROM dbo.usuariosPrincipiosPermisos upp
        INNER JOIN dbo.submodulos_dgci s
          ON s.SubModuleId = upp.SubModuleId
        WHERE upp.UserId = @UserId
          AND LOWER(s.SubModuleKey) = LOWER(@SubModuleKey)
          AND ISNULL(upp.CanView, 0) = 1
      `);

    return NextResponse.json({
      ok: true,
      role,
      isFullAccess: false,
      principios: permisos.recordset,
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        error: "Error al cargar permisos",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}