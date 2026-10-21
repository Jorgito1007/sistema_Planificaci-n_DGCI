"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

// ============================================================
// LOGIN
// ============================================================

export async function login(formData: FormData) {
  const email = String(
    formData.get("email") || ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") || ""
  );

  // ==========================================================
  // VALIDACIONES BÁSICAS
  // ==========================================================

  if (!email || !password) {
    redirect(
      "/auth/login?error=Email y contraseña requeridos"
    );
  }

  const JWT_SECRET =
    process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    redirect(
      "/auth/login?error=Falta JWT_SECRET en .env.local"
    );
  }

  // ==========================================================
  // BUSCAR USUARIO
  // ==========================================================

  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "Email",
      sql.NVarChar(255),
      email
    )
    .query(`
      SELECT TOP 1
        u.UserId,
        u.Email,
        u.FullName,
        u.Cargo,
        u.PasswordHash,
        u.IsActive,
        u.MustChangePassword,
        r.RoleKey
      FROM dbo.Usuarios_Dgci u
      LEFT JOIN dbo.UserRoles_Dgci ur
        ON ur.UserId = u.UserId
      LEFT JOIN dbo.Roles_Dgci r
        ON r.RoleId = ur.RoleId
      WHERE LOWER(u.Email) = @Email;
    `);

  const user =
    result.recordset[0];

  // ==========================================================
  // VALIDAR USUARIO
  // ==========================================================

  if (!user) {
    redirect(
      "/auth/login?error=Credenciales inválidas"
    );
  }

  if (!user.IsActive) {
    redirect(
      "/auth/login?error=Usuario inactivo"
    );
  }

  // ==========================================================
  // VALIDAR CONTRASEÑA
  // ==========================================================

  const passwordCorrect =
    await bcrypt.compare(
      password,
      user.PasswordHash
    );

  if (!passwordCorrect) {
    redirect(
      "/auth/login?error=Credenciales inválidas"
    );
  }

  // ==========================================================
  // CREAR TOKEN
  // ==========================================================

  const mustChangePassword =
    user.MustChangePassword === true ||
    user.MustChangePassword === 1;

  const token = jwt.sign(
    {
      userId: String(user.UserId),

      email: user.Email,

      role:
        user.RoleKey ?? "",

      full_name:
        user.FullName ?? "",

      cargo:
        user.Cargo ?? "",

      mustChangePassword,
    },
    JWT_SECRET!,
    {
      expiresIn: "8h",
    }
  );

  // ==========================================================
  // GUARDAR COOKIE
  // ==========================================================

  const cookieStore =
    await cookies();

  cookieStore.set(
    "auth_token",
    token,
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",

      // En producción con HTTPS puedes establecer:
      // secure: true,

      maxAge:
        60 * 60 * 8,
    }
  );

  // ==========================================================
  // FORZAR CAMBIO DE CONTRASEÑA
  // ==========================================================

  if (mustChangePassword) {
    redirect(
      "/auth/cambiar-contrasena"
    );
  }

  // ==========================================================
  // ACCESO NORMAL
  // ==========================================================

  redirect("/dashboard");
}



export async function changeTemporaryPassword(
  formData: FormData
) {
  const password = String(
    formData.get("password") || ""
  );

  const confirmPassword = String(
    formData.get("confirmPassword") || ""
  );

  // ==========================================================
  // VALIDAR CAMPOS
  // ==========================================================

  if (!password || !confirmPassword) {
    redirect(
      "/auth/cambiar-contrasena?error=Complete ambos campos"
    );
  }

  if (password !== confirmPassword) {
    redirect(
      "/auth/cambiar-contrasena?error=Las contraseñas no coinciden"
    );
  }

  // ==========================================================
  // VALIDAR COMPLEJIDAD
  // ==========================================================

  if (password.length < 8) {
    redirect(
      "/auth/cambiar-contrasena?error=La contraseña debe tener al menos 8 caracteres"
    );
  }

  if (!/[A-Z]/.test(password)) {
    redirect(
      "/auth/cambiar-contrasena?error=La contraseña debe contener al menos una letra mayúscula"
    );
  }

  if (!/[a-z]/.test(password)) {
    redirect(
      "/auth/cambiar-contrasena?error=La contraseña debe contener al menos una letra minúscula"
    );
  }

  if (!/[0-9]/.test(password)) {
    redirect(
      "/auth/cambiar-contrasena?error=La contraseña debe contener al menos un número"
    );
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    redirect(
      "/auth/cambiar-contrasena?error=La contraseña debe contener al menos un símbolo"
    );
  }

  // ==========================================================
  // VALIDAR JWT
  // ==========================================================

  const JWT_SECRET =
    process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    redirect(
      "/auth/login?error=Configuración de seguridad inválida"
    );
  }

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "auth_token"
    )?.value;

  if (!token) {
    redirect(
      "/auth/login?error=Sesión no válida"
    );
  }

  let decoded: any;

  try {
    decoded =
      jwt.verify(
        token,
        JWT_SECRET!
      );
  } catch {
    redirect(
      "/auth/login?error=La sesión expiró. Inicie sesión nuevamente."
    );
  }

  const userId =
    decoded?.userId;

  if (!userId) {
    redirect(
      "/auth/login?error=Sesión no válida"
    );
  }

  // ==========================================================
  // CONSULTAR USUARIO
  // ==========================================================

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
          UserId,
          Email,
          FullName,
          Cargo,
          IsActive,
          MustChangePassword
        FROM dbo.Usuarios_Dgci
        WHERE UserId = @UserId;
      `);

  const user =
    result.recordset[0];

  if (!user) {
    redirect(
      "/auth/login?error=Usuario no encontrado"
    );
  }

  if (!user.IsActive) {
    redirect(
      "/auth/login?error=Usuario inactivo"
    );
  }

  // ==========================================================
  // VERIFICAR QUE REALMENTE DEBA CAMBIAR CONTRASEÑA
  // ==========================================================

  const mustChangePassword =
    user.MustChangePassword ===
      true ||
    user.MustChangePassword ===
      1;

  if (!mustChangePassword) {
    redirect("/dashboard");
  }

  // ==========================================================
  // GENERAR HASH
  // ==========================================================

  const hash =
    await bcrypt.hash(
      password,
      10
    );

  // ==========================================================
  // ACTUALIZAR CONTRASEÑA
  // ==========================================================

  await pool
    .request()
    .input(
      "UserId",
      sql.UniqueIdentifier,
      userId
    )
    .input(
      "PasswordHash",
      sql.NVarChar(255),
      hash
    )
    .query(`
      UPDATE dbo.Usuarios_Dgci
      SET
        PasswordHash = @PasswordHash,
        MustChangePassword = 0,
        UpdatedAt = SYSDATETIME()
      WHERE UserId = @UserId;
    `);

  // ==========================================================
  // CREAR NUEVO TOKEN
  // ==========================================================

  const newToken =
    jwt.sign(
      {
        userId:
          String(user.UserId),

        email:
          user.Email,

        role:
          decoded.role ?? "",

        full_name:
          user.FullName ?? "",

        cargo:
          user.Cargo ?? "",

        mustChangePassword:
          false,
      },
      JWT_SECRET!,
      {
        expiresIn: "8h",
      }
    );

  cookieStore.set(
    "auth_token",
    newToken,
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge:
        60 * 60 * 8,
    }
  );

  // ==========================================================
  // ENTRAR AL SISTEMA
  // ==========================================================

  redirect("/dashboard");
}

// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    "auth_token",
    "",
    {
      path: "/",
      expires:
        new Date(0),
    }
  );

  redirect("/auth/login");
}