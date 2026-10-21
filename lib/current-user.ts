import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { getPool, sql } from "@/lib/db";
import { auth } from "@/auth";

// ============================================================
// TIPOS
// ============================================================

export type CurrentUser = {
  userId: string;
  email: string;
  full_name: string;
  cargo: string;
  role: string;
  roleKey: string;
  is_active: boolean;
  mustChangePassword: boolean;
};

type AuthTokenPayload = {
  userId?: string;
  UserId?: string;
  id?: string;

  email?: string;

  role?: string;

  full_name?: string;
  fullName?: string;

  cargo?: string;

  mustChangePassword?: boolean;

  iat?: number;
  exp?: number;
};

// ============================================================
// LEER AUTH_TOKEN
// ============================================================

export async function getCurrentUserFromToken():
  Promise<AuthTokenPayload | null> {

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "auth_token"
    )?.value;

  if (!token) {
    return null;
  }

  const JWT_SECRET =
    process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error(
      "JWT_SECRET no está configurado."
    );

    return null;
  }

  try {
    const payload =
      jwt.verify(
        token,
        JWT_SECRET
      ) as AuthTokenPayload;

    return payload;
  } catch (error) {
    console.error(
      "Error leyendo auth_token:",
      error
    );

    return null;
  }
}

// ============================================================
// MAPEAR USUARIO
// ============================================================

function mapCurrentUser(
  row: any
): CurrentUser {

  return {
    userId:
      String(row.UserId),

    email:
      String(row.Email || ""),

    full_name:
      row.FullName ??
      "Usuario",

    cargo:
      row.Cargo ??
      "",

    role:
      row.RoleName ??
      "",

    roleKey:
      row.RoleKey ??
      "",

    is_active:
      row.IsActive === true ||
      row.IsActive === 1,

    mustChangePassword:
      row.MustChangePassword === true ||
      row.MustChangePassword === 1,
  };
}

// ============================================================
// BUSCAR USUARIO POR CORREO
// ============================================================

export async function getUserByEmail(
  email: string
): Promise<CurrentUser | null> {

  try {

    if (!email?.trim()) {
      return null;
    }

    const pool =
      await getPool();

    const result =
      await pool
        .request()
        .input(
          "Email",
          sql.NVarChar(255),
          email.trim()
        )
        .query(`
          SELECT TOP 1

            u.UserId,
            u.Email,
            u.FullName,
            u.Cargo,
            u.IsActive,
            u.MustChangePassword,

            rr.RoleName,
            rr.RoleKey

          FROM dbo.Usuarios_Dgci u

          INNER JOIN dbo.UserRoles_Dgci r
            ON u.UserId = r.UserId

          INNER JOIN dbo.Roles_Dgci rr
            ON r.RoleId = rr.RoleId

          WHERE
            LOWER(u.Email) =
            LOWER(@Email)

            AND u.IsActive = 1;
        `);

    const row =
      result.recordset[0];

    if (!row) {
      return null;
    }

    return mapCurrentUser(row);

  } catch (error) {

    console.error(
      "Error obteniendo usuario por correo:",
      error
    );

    return null;
  }
}

// ============================================================
// BUSCAR USUARIO POR ID
// ============================================================

export async function getUserById(
  userId: string
): Promise<CurrentUser | null> {

  try {

    if (!userId?.trim()) {
      return null;
    }

    const pool =
      await getPool();

    const result =
      await pool
        .request()
        .input(
          "UserId",
          sql.UniqueIdentifier,
          userId
        )
        .query(`
          SELECT TOP 1

            u.UserId,
            u.Email,
            u.FullName,
            u.Cargo,
            u.IsActive,
            u.MustChangePassword,

            rr.RoleName,
            rr.RoleKey

          FROM dbo.Usuarios_Dgci u

          INNER JOIN dbo.UserRoles_Dgci r
            ON u.UserId = r.UserId

          INNER JOIN dbo.Roles_Dgci rr
            ON r.RoleId = rr.RoleId

          WHERE
            u.UserId = @UserId

            AND u.IsActive = 1;
        `);

    const row =
      result.recordset[0];

    if (!row) {
      return null;
    }

    return mapCurrentUser(row);

  } catch (error) {

    console.error(
      "Error obteniendo usuario por ID:",
      error
    );

    return null;
  }
}

// ============================================================
// USUARIO ACTUAL
// ============================================================

export async function getCurrentUser():
  Promise<CurrentUser | null> {

  try {

    // ========================================================
    // 1. AUTENTICACIÓN POR AUTH_TOKEN
    // ========================================================

    const payload =
      await getCurrentUserFromToken();

    const tokenUserId =
      payload?.userId ??
      payload?.UserId ??
      payload?.id;

    // --------------------------------------------------------
    // Preferimos UserId porque es el identificador principal.
    // --------------------------------------------------------

    if (tokenUserId) {

      const user =
        await getUserById(
          String(tokenUserId)
        );

      /*
       * IMPORTANTE:
       *
       * getUserById() consulta nuevamente SQL.
       *
       * Si el administrador bloqueó al usuario:
       *
       * IsActive = 0
       *
       * getUserById() devolverá null.
       *
       * Por lo tanto el JWT existente deja de ser suficiente
       * para continuar usando el sistema.
       */

      if (user) {
        return user;
      }

      /*
       * Si existe auth_token pero el usuario ya no está
       * habilitado, NO debemos intentar recuperarlo mediante
       * NextAuth.
       *
       * De lo contrario podríamos permitir que un usuario
       * bloqueado entrara por otro mecanismo de autenticación.
       */

      return null;
    }

    // --------------------------------------------------------
    // Compatibilidad con tokens antiguos que solo tengan email.
    // --------------------------------------------------------

    if (payload?.email) {

      const user =
        await getUserByEmail(
          payload.email
        );

      if (user) {
        return user;
      }

      return null;
    }

    // ========================================================
    // 2. AUTENTICACIÓN MEDIANTE AUTH.JS / GOOGLE
    // ========================================================

    const session =
      await auth();

    const userEmail =
      session?.user?.email;

    if (!userEmail) {
      return null;
    }

    /*
     * Aunque Google haya autenticado correctamente al usuario,
     * todavía consultamos Usuarios_Dgci.
     *
     * De esta forma:
     *
     * IsActive = 0
     *
     * significa que el usuario tampoco podrá acceder mediante
     * Google.
     */

    return await getUserByEmail(
      userEmail
    );

  } catch (error) {

    console.error(
      "Error obteniendo usuario actual:",
      error
    );

    return null;
  }
}

// ============================================================
// OBTENER SOLAMENTE USER ID
// ============================================================

export async function getCurrentUserId():
  Promise<string | null> {

  const user =
    await getCurrentUser();

  return (
    user?.userId ??
    null
  );
}