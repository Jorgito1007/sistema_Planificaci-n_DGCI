import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";
import { auth } from "@/auth";

type CurrentUser = {
  userId: string;
  email: string;
  full_name: string;
  role: string;
  roleKey: string;
};

export async function getCurrentUserFromToken() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      UserId?: string;
      id?: string;
      email?: string;
      role?: string;
      fullName?: string;
    };

    return payload;
  } catch (error) {
    console.error("Error leyendo auth_token:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<CurrentUser | null> {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Email", sql.VarChar(255), email)
      .query(`
        SELECT TOP 1
          u.UserId,
          u.Email,
          u.FullName,
          rr.RoleName,
          rr.RoleKey
        FROM dbo.Usuarios_Dgci u
        INNER JOIN dbo.UserRoles_Dgci r 
          ON u.UserId = r.UserId
        INNER JOIN dbo.Roles_Dgci rr 
          ON r.RoleId = rr.RoleId
        WHERE LOWER(u.Email) = LOWER(@Email)
          AND u.IsActive = 1
      `);

    const row = result.recordset[0];

    if (!row) return null;

    return {
      userId: String(row.UserId),
      email: row.Email,
      full_name: row.FullName ?? "Usuario",
      role: row.RoleName,
      roleKey: row.RoleKey,
    };
  } catch (error) {
    console.error("Error obteniendo usuario por correo:", error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<CurrentUser | null> {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT TOP 1
          u.UserId,
          u.Email,
          u.FullName,
          rr.RoleName,
          rr.RoleKey
        FROM dbo.Usuarios_Dgci u
        INNER JOIN dbo.UserRoles_Dgci r 
          ON u.UserId = r.UserId
        INNER JOIN dbo.Roles_Dgci rr 
          ON r.RoleId = rr.RoleId
        WHERE u.UserId = @UserId
          AND u.IsActive = 1
      `);

    const row = result.recordset[0];

    if (!row) return null;

    return {
      userId: String(row.UserId),
      email: row.Email,
      full_name: row.FullName ?? "Usuario",
      role: row.RoleName,
      roleKey: row.RoleKey,
    };
  } catch (error) {
    console.error("Error obteniendo usuario por ID:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // 1. Primero intentar con auth_token
    const payload = await getCurrentUserFromToken();

    const tokenUserId =
      payload?.userId ??
      payload?.UserId ??
      payload?.id;

    if (tokenUserId) {
      const user = await getUserById(String(tokenUserId));
      if (user) return user;
    }

    if (payload?.email) {
      const user = await getUserByEmail(payload.email);
      if (user) return user;
    }

    // 2. Luego intentar con NextAuth
    const session = await auth();

    const userEmail = session?.user?.email;

    if (!userEmail) return null;

    return await getUserByEmail(userEmail);
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.userId ?? null;
}