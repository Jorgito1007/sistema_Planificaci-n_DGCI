import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Falta JWT_SECRET en .env.local");

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const pool = await getPool();

  const result = await pool.request()
    .input("Email", sql.NVarChar(255), email)
    .query(`
      SELECT u.UserId, u.Email, u.FullName, u.PasswordHash, u.IsActive, r.RoleKey
      FROM dbo.Usuarios_Dgci u
      LEFT JOIN dbo.UserRoles_Dgci ur ON ur.UserId = u.UserId
      LEFT JOIN dbo.Roles_Dgci r ON r.RoleId = ur.RoleId
      WHERE u.Email = @Email
    `);

  const user = result.recordset[0];

  if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  if (!user.IsActive) return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });

  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = jwt.sign(
    { userId: user.UserId, email: user.Email, role: user.RoleKey },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  const res = NextResponse.json({
    ok: true,
    user: { userId: user.UserId, email: user.Email, fullName: user.FullName, role: user.RoleKey }
  });

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}