import { getPool, sql } from "@/lib/db";
import type { CurrentUser } from "@/lib/current-user";

// ============================================================
// HELPERS DE PERMISOS PARA RUTAS API
//
// Todas las funciones:
// - reciben el usuario ya validado por getCurrentUser()
// - consultan la BASE (no confían en el JWT)
// - administrador / subadministrador tienen acceso total
// ============================================================

/**
 * Normaliza el RoleKey del usuario.
 */
function roleKeyDe(user: CurrentUser): string {
  return String(user.roleKey || user.role || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
}

/**
 * true si el usuario es administrador o subadministrador.
 */
export function esAdministrativo(user: CurrentUser): boolean {
  const key = roleKeyDe(user);
  return key === "administrador" || key === "subadministrador";
}

/**
 * true si el usuario tiene CanView = 1 sobre el módulo
 * (ej: "informes", "permisos_usuario").
 * Administrador / subadministrador siempre true.
 */
export async function puedeVerModulo(
  user: CurrentUser,
  moduleKey: string
): Promise<boolean> {
  if (esAdministrativo(user)) return true;

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, user.userId)
      .input("ModuleKey", sql.NVarChar(100), moduleKey)
      .query(`
        SELECT TOP 1
          ump.CanView
        FROM dbo.usuariosModulosPermisos AS ump
        INNER JOIN dbo.Modulos_Dgci AS m
          ON m.ModuleId = ump.ModuleId
        WHERE
          ump.UserId = @UserId
          AND LOWER(m.ModuleKey) = LOWER(@ModuleKey)
          AND ump.CanView = 1;
      `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error("Error verificando permiso de módulo:", error);
    return false;
  }
}

/**
 * true si el usuario tiene CanView = 1 sobre el submódulo
 * (ej: "sa_Reultados", "m_Reultados").
 * Administrador / subadministrador siempre true.
 */
export async function puedeVerSubmodulo(
  user: CurrentUser,
  subModuleKey: string
): Promise<boolean> {
  if (esAdministrativo(user)) return true;

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, user.userId)
      .input("SubModuleKey", sql.NVarChar(100), subModuleKey)
      .query(`
        SELECT TOP 1
          usp.CanView
        FROM dbo.usuariosSubmodulospermisos AS usp
        INNER JOIN dbo.submodulos_dgci AS s
          ON s.SubModuleId = usp.SubModuleId
        WHERE
          usp.UserId = @UserId
          AND LOWER(s.SubModuleKey) = LOWER(@SubModuleKey)
          AND usp.CanView = 1;
      `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error("Error verificando permiso de submódulo:", error);
    return false;
  }
}

/**
 * true si el rol del usuario tiene CanApproveResults = 1.
 * Misma consulta que /api/matriz-sistema-administrativo/permisos,
 * para que el backend y la interfaz coincidan exactamente.
 */
export async function puedeAprobarResultados(
  user: CurrentUser
): Promise<boolean> {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, user.userId)
      .query(`
        SELECT
          MAX(CAST(r.CanApproveResults AS INT)) AS PuedeAprobar
        FROM dbo.UserRoles_Dgci AS ur
        INNER JOIN dbo.Roles_Dgci AS r
          ON r.RoleId = ur.RoleId
        WHERE ur.UserId = @UserId;
      `);

    return Number(result.recordset[0]?.PuedeAprobar ?? 0) === 1;
  } catch (error) {
    console.error("Error verificando permiso de aprobación:", error);
    return false;
  }
}
