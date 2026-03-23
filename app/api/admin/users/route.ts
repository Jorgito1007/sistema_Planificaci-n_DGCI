import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

async function requireAdmin() {
const cookieStore = await cookies();
const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (String(payload.role || "").toLowerCase() !== "administrador") return null;
  return payload;
}

export async function GET() {
  const me = requireAdmin();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const pool = await getPool();

  const res = await pool.request().query(`
  SELECT
  CAST(u.UserId AS nvarchar(36)) AS id,
  u.Email AS email,
  u.FullName AS full_name,
  r.RoleKey AS role,
  u.IsActive AS is_active
FROM dbo.Usuarios_Dgci u
LEFT JOIN dbo.UserRoles_Dgci ur ON ur.UserId = u.UserId
LEFT JOIN dbo.Roles_Dgci r ON r.RoleId = ur.RoleId
ORDER BY u.Email;
  `);

  return NextResponse.json({ users: res.recordset });
}