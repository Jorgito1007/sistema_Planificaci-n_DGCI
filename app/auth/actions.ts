"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";
import { auth } from "@/auth";
import {
  puedeIntentar,
  registrarIntento,
  limpiarIntentos,
  obtenerIp,
} from "@/lib/rate-limit";

/**
 * Rate limiting del login (fuerza bruta):
 * 5 intentos fallidos por correo+IP y 20 por IP cada 15 minutos.
 */
const MAX_INTENTOS_CORREO = 5;
const MAX_INTENTOS_IP = 20;
const VENTANA_MS = 15 * 60 * 1000;

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
  // RATE LIMITING (ATAQUES DE FUERZA BRUTA)
  // ==========================================================

  const cabeceras = await headers();
  const ip = obtenerIp(cabeceras);

  const claveEmail = `login:${ip}:${email}`;
  const claveIp = `login-ip:${ip}`;

  if (
    !puedeIntentar(
      claveEmail,
      MAX_INTENTOS_CORREO,
      VENTANA_MS
    ) ||
    !puedeIntentar(
      claveIp,
      MAX_INTENTOS_IP,
      VENTANA_MS
    )
  ) {
    redirect(
      "/auth/login?error=Demasiados intentos de inicio de sesión. Espere unos minutos e intente de nuevo"
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
    registrarIntento(
      claveEmail,
      MAX_INTENTOS_CORREO,
      VENTANA_MS
    );
    registrarIntento(
      claveIp,
      MAX_INTENTOS_IP,
      VENTANA_MS
    );
    redirect(
      "/auth/login?error=Credenciales inválidas"
    );
  }

  if (!user.IsActive) {
    registrarIntento(
      claveEmail,
      MAX_INTENTOS_CORREO,
      VENTANA_MS
    );
    registrarIntento(
      claveIp,
      MAX_INTENTOS_IP,
      VENTANA_MS
    );
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
    registrarIntento(
      claveEmail,
      MAX_INTENTOS_CORREO,
      VENTANA_MS
    );
    registrarIntento(
      claveIp,
      MAX_INTENTOS_IP,
      VENTANA_MS
    );
    redirect(
      "/auth/login?error=Credenciales inválidas"
    );
  }

  /**
   * Login exitoso: reiniciar el contador del correo.
   */
  limpiarIntentos(claveEmail);

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
  // IDENTIFICAR SESIÓN
  //
  // Se aceptan los dos inicios de sesión del sistema:
  //
  // 1. auth_token  → login con contraseña (JWT propio)
  // 2. Sesión Google / Auth.js → quien entró con su correo
  //
  // Así, un usuario con contraseña temporal también puede
  // completar el cambio si ingresó mediante Google.
  // ==========================================================

  const JWT_SECRET =
    process.env.JWT_SECRET;

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "auth_token"
    )?.value;

  let userId: string | null = null;

  if (token && JWT_SECRET) {
    try {
      const decoded: any =
        jwt.verify(
          token,
          JWT_SECRET
        );

      userId =
        decoded?.userId ?? null;
    } catch {
      // Token expirado/inválido: se intenta con la sesión de Google.
      userId = null;
    }
  }

  // --------------------------------------------------------
  // Sesión Google / Auth.js (no existe auth_token)
  // --------------------------------------------------------

  if (!userId) {
    const session =
      await auth();

    const emailSesion =
      session?.user?.email?.trim().toLowerCase();

    if (emailSesion) {
      const poolSesion =
        await getPool();

      const resultadoSesion =
        await poolSesion
          .request()
          .input(
            "Email",
            sql.NVarChar(255),
            emailSesion
          )
          .query(`
            SELECT TOP 1
              UserId
            FROM dbo.Usuarios_Dgci
            WHERE LOWER(Email) = @Email;
          `);

      userId =
        resultadoSesion.recordset[0]?.UserId ??
        null;
    }
  }

  if (!userId) {
    redirect(
      "/auth/login?error=Sesión no válida. Inicie sesión nuevamente."
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
  // CERRAR SESIÓN Y REGRESAR AL LOGIN
  //
  // La contraseña ya cambió: se eliminan AMBAS cookies
  // (JWT propio y sesión Google/Auth.js) para que el
  // usuario ingrese con sus nuevas credenciales.
  // ==========================================================

  cookieStore.delete({
    name: "auth_token",
    path: "/",
  });

  cookieStore.delete({
    name: "authjs.session-token",
    path: "/",
  });

  cookieStore.delete({
    name: "__Secure-authjs.session-token",
    path: "/",
  });

  redirect(
    "/auth/login?exito=" +
      encodeURIComponent(
        "Contraseña cambiada correctamente. Inicie sesión con su nueva contraseña."
      )
  );
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