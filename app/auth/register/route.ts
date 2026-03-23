import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";

export async function POST(req: Request) {
  const { email, password, fullName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const pool = await getPool();

  // Existe?
  const exists = await pool.request()
    .input("Email", sql.NVarChar(255), email)
    .query(`SELECT 1 FROM dbo.Usuarios_Dgci WHERE Email = @Email`);

  if (exists.recordset.length) {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  const inserted = await pool.request()
    .input("Email", sql.NVarChar(255), email)
    .input("FullName", sql.NVarChar(200), fullName ?? null)
    .input("PasswordHash", sql.NVarChar(255), hash)
    .query(`
      INSERT INTO dbo.Usuarios_Dgci (Email, FullName, PasswordHash)
      OUTPUT INSERTED.UserId
      VALUES (@Email, @FullName, @PasswordHash)
    `);

  const userId = inserted.recordset[0].UserId;

  // Rol por defecto: asesor
  await pool.request()
    .input("UserId", sql.UniqueIdentifier, userId)
    .query(`
      INSERT INTO dbo.UserRoles_Dgci (UserId, RoleId)
      SELECT @UserId, RoleId FROM dbo.Roles_Dgci WHERE RoleKey='asesor'
    `);

  return NextResponse.json({ ok: true, userId });
}