import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// REGISTRO DE USUARIOS
//
// SEGURIDAD: solo un administrador autenticado puede crear
// usuarios, y únicamente con correo institucional @uncsm.edu.ni.
// ============================================================

export async function POST(req: Request) {
  const { email, password, fullName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  // --------------------------------------------------------
  // 1. EXIGIR SESIÓN DE ADMINISTRADOR
  // --------------------------------------------------------
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = String(me.roleKey || me.role || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

  if (role !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // --------------------------------------------------------
  // 2. SOLO CORREOS INSTITUCIONALES
  // --------------------------------------------------------
  const emailNorm = String(email).trim().toLowerCase();

  if (!emailNorm.endsWith("@uncsm.edu.ni")) {
    return NextResponse.json(
      { error: "Solo se permiten correos institucionales @uncsm.edu.ni" },
      { status: 400 }
    );
  }

  if (String(password).length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const pool = await getPool();

  // Existe?
  const exists = await pool.request()
    .input("Email", sql.NVarChar(255), emailNorm)
    .query(`SELECT 1 FROM dbo.Usuarios_Dgci WHERE Email = @Email`);

  if (exists.recordset.length) {
    return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  const inserted = await pool.request()
    .input("Email", sql.NVarChar(255), emailNorm)
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