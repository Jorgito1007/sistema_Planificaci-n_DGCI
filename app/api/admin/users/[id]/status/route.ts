import { NextRequest, NextResponse } from "next/server";

import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// PATCH
// /api/admin/users/[id]/status
//
// Activa o bloquea un usuario.
// ============================================================

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // ========================================================
    // 1. VALIDAR USUARIO ACTUAL
    // ========================================================

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // 2. SOLO ADMINISTRADOR
    // ========================================================

    const role = String(
      me.role || ""
    )
      .trim()
      .toLowerCase();

    if (role !== "administrador") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tiene permisos para realizar esta acción.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // 3. OBTENER ID DEL USUARIO
    // ========================================================

    const { id } = await params;

    const userId = String(
      id || ""
    ).trim();

    if (
      !userId ||
      userId === "undefined" ||
      userId === "null"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Usuario inválido.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 4. LEER NUEVO ESTADO
    // ========================================================

    const body = await request.json();

    const isActive =
      body?.is_active;

    if (
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Debe indicar el estado del usuario.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. EVITAR QUE EL ADMINISTRADOR SE BLOQUEE A SÍ MISMO
    // ========================================================

    const currentUserId = String(
      me.userId || ""
    ).trim();

    if (
      currentUserId &&
      currentUserId.toLowerCase() ===
        userId.toLowerCase() &&
      !isActive
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No puede bloquear su propia cuenta.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 6. BUSCAR USUARIO
    // ========================================================

    const pool =
      await getPool();

    const userResult =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT TOP 1
            UserId,
            Email,
            FullName,
            IsActive
          FROM dbo.Usuarios_Dgci
          WHERE UserId = @UserId;
        `);

    const user =
      userResult.recordset[0];

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El usuario no existe.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // 7. VERIFICAR SI YA TIENE ESE ESTADO
    // ========================================================

    const currentStatus =
      user.IsActive === true ||
      user.IsActive === 1;

    if (
      currentStatus === isActive
    ) {
      return NextResponse.json(
        {
          ok: true,

          message:
            isActive
              ? "El usuario ya se encuentra activo."
              : "El usuario ya se encuentra bloqueado.",

          is_active:
            currentStatus,
        },
        {
          status: 200,
        }
      );
    }

    // ========================================================
    // 8. ACTUALIZAR ESTADO
    // ========================================================

    await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        userId
      )
      .input(
        "IsActive",
        sql.Bit,
        isActive ? 1 : 0
      )
      .query(`
        UPDATE dbo.Usuarios_Dgci
        SET
          IsActive = @IsActive,
          UpdatedAt = SYSDATETIME()
        WHERE UserId = @UserId;
      `);

    // ========================================================
    // 9. RESPUESTA
    // ========================================================

    return NextResponse.json(
      {
        ok: true,

        message:
          isActive
            ? "El usuario fue desbloqueado correctamente."
            : "El usuario fue bloqueado correctamente.",

        user: {
          id: userId,

          email:
            user.Email,

          full_name:
            user.FullName,

          is_active:
            isActive,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Error actualizando estado del usuario:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          "No se pudo actualizar el estado del usuario.",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}