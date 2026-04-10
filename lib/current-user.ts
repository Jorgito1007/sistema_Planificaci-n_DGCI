import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

export async function getCurrentUserFromToken() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string;
      email?: string;
      role?: string;
      fullName?: string;
    };

    return payload;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<{
  userId: string;
  email: string;
  full_name: string;
  role: string;
} | null> {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Email", sql.VarChar, email)
      .query(`
        SELECT TOP 1
          u.UserId,
          u.Email,
          u.FullName,
          rr.RoleName
        FROM Usuarios_Dgci u
        INNER JOIN dbo.UserRoles_Dgci r ON u.UserId = r.UserId
        INNER JOIN dbo.Roles_Dgci rr ON r.RoleId = rr.RoleId
        WHERE u.Email = @Email
      `);

    const row = result.recordset[0];
    if (!row) return null;

    return {
      userId: String(row.UserId),
      email: row.Email,
      full_name: row.FullName ?? "Usuario",
      role: row.RoleName,
    };
  } catch (error) {
    console.error("Error obteniendo usuario por correo:", error);
    return null;
  }
}
