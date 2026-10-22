import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPool, sql } from "@/lib/db";

// ============================================================
// VALIDAR ADMINISTRADOR / SUBADMINISTRADOR
// ============================================================

async function requireAdmin() {
  const session = await auth();

  console.log("SESSION AUTH:", session);

  if (!session?.user?.email) {
    return null;
  }

  const pool = await getPool();

  const userRes = await pool
    .request()
    .input(
      "Email",
      sql.VarChar(255),
      session.user.email
    )
    .query(`
      SELECT TOP 1
        u.UserId,
        u.Email,
        u.FullName,
        u.IsActive,
        ro.RoleName AS Role
      FROM dbo.Usuarios_Dgci u
      INNER JOIN dbo.UserRoles_Dgci r
        ON r.UserId = u.UserId
      INNER JOIN dbo.Roles_Dgci ro
        ON r.RoleId = ro.RoleId
      WHERE LOWER(u.Email) = LOWER(@Email)
        AND u.IsActive = 1
    `);

  const user =
    userRes.recordset?.[0];

  console.log(
    "USUARIO DB:",
    user
  );

  if (!user) {
    return null;
  }

  const role = String(
    user.Role || ""
  )
    .trim()
    .toLowerCase();

  if (
    role !== "administrador" &&
    role !== "subadministrador"
  ) {
    return null;
  }

  return user;
}

// ============================================================
// GET PERMISOS DEL USUARIO
// ============================================================

export async function GET(
  req: Request
) {
  try {
    // ==========================================================
    // 1. VALIDAR ADMINISTRADOR
    // ==========================================================

    const me =
      await requireAdmin();

    if (!me) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================================
    // 2. OBTENER USER ID DESDE URL
    //
    // /api/admin/users/[userId]/permissions
    // ==========================================================

    const url =
      new URL(req.url);

    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);

    const userId =
      parts[
        parts.length - 2
      ];

    console.log(
      "USER ID EXTRAIDO:",
      userId
    );

    // ==========================================================
    // 3. VALIDAR GUID
    // ==========================================================

    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (
      !guidRegex.test(
        userId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "UserId inválido",

          detail:
            `No es GUID: ${userId}`,
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // 4. CONEXIÓN
    // ==========================================================

    const pool =
      await getPool();

    // ==========================================================
    // 5. PERMISOS DE MÓDULOS
    // ==========================================================

    console.log(
      "ANTES DE CONSULTAR MODULOS"
    );

    const modRes =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT
            ModuleId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          FROM dbo.usuariosModulosPermisos
          WHERE UserId = @UserId
          ORDER BY ModuleId;
        `);

    // ==========================================================
    // 6. PERMISOS DE SUBMÓDULOS
    // ==========================================================

    const subRes =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT
            SubModuleId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          FROM dbo.usuariosSubmodulospermisos
          WHERE UserId = @UserId
          ORDER BY SubModuleId;
        `);

    console.log(
      "SUBMODULOS PERMISOS:",
      subRes.recordset
    );

    // ==========================================================
    // 7. PERMISOS DE PRINCIPIOS
    //
    // MATRIZ POR COMPONENTES
    // ==========================================================

    const principioRes =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT
            SubModuleId,
            PrincipioId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          FROM dbo.usuariosPrincipiosPermisos
          WHERE UserId = @UserId
          ORDER BY
            SubModuleId,
            PrincipioId;
        `);

    console.log(
      "PRINCIPIOS PERMISOS:",
      principioRes.recordset
    );

    // ==========================================================
    // 8. PREGUNTAS DEL SISTEMA ADMINISTRATIVO
    //
    // usuariosPreguntasPermisos
    // ==========================================================

    const questionRes =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT
            PermissionId,
            SubModuleId,
            QuestionId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          FROM dbo.usuariosPreguntasPermisos
          WHERE UserId = @UserId
          ORDER BY
            SubModuleId,
            QuestionId;
        `);

    console.log(
      "PREGUNTAS SISTEMA ADMINISTRATIVO:",
      questionRes.recordset
    );

    // ==========================================================
    // 9. PREGUNTAS DE MATRIZ POR COMPONENTES
    //
    // usuariosPrincipiosPreguntasPermisos
    // ==========================================================

    const principleQuestionRes =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT
            PermissionId,
            SubModuleId,
            QuestionId,
            CanView,
            CanCreate,
            CanEdit,
            CanDelete
          FROM dbo.usuariosPrincipiosPreguntasPermisos
          WHERE UserId = @UserId
          ORDER BY
            SubModuleId,
            QuestionId;
        `);

    console.log(
      "PREGUNTAS POR COMPONENTES:",
      principleQuestionRes.recordset
    );

    // ==========================================================
    // 10. RESPUESTA
    // ==========================================================

    return NextResponse.json({
      // Módulos
      modulePermissions:
        modRes.recordset || [],

      // Submódulos
      permissions:
        subRes.recordset || [],

      // Principios - Por Componentes
      principlePermissions:
        principioRes.recordset ||
        [],

      // Preguntas - Sistema Administrativo
      questionPermissions:
        questionRes.recordset ||
        [],

      // Preguntas - Por Componentes
      principleQuestionPermissions:
        principleQuestionRes.recordset ||
        [],
    });

  } catch (e: any) {
    console.error(
      "PERMS ERROR COMPLETO:",
      e
    );

    console.error("PERMS ERROR MESSAGE:", e?.message);

    return NextResponse.json(
      {
        error:
          "Server error",

        detail:
          "Contacte al administrador del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}