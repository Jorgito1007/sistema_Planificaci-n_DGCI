"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/auth/login?error=Email y contraseña requeridos");
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    redirect("/auth/login?error=Falta JWT_SECRET en .env.local");
  }

  const pool = await getPool();

  const result = await pool
    .request()
    .input("Email", sql.NVarChar(255), email)
    .query(`
      SELECT u.UserId, u.Email, u.FullName, u.PasswordHash, u.IsActive, r.RoleKey
      FROM dbo.Usuarios_Dgci u
      LEFT JOIN dbo.UserRoles_Dgci ur ON ur.UserId = u.UserId
      LEFT JOIN dbo.Roles_Dgci r ON r.RoleId = ur.RoleId
      WHERE u.Email = @Email
    `);

  const user = result.recordset[0];

  if (!user) redirect("/auth/login?error=Credenciales inválidas");
  if (!user.IsActive) redirect("/auth/login?error=Usuario inactivo");

  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) redirect("/auth/login?error=Credenciales inválidas");

const token = jwt.sign(
  {
    userId: user.UserId,
    email: user.Email,
    role: user.RoleKey,
    full_name: user.FullName ?? "",
  },
  JWT_SECRET!,
  { expiresIn: "8h" }
);

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", { path: "/", expires: new Date(0) });
  redirect("/auth/login");
}