import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ============================================================
// PROXY DE SEGURIDAD (antes "middleware")
//
// Protege en el borde:
// - /dashboard/*  → sin sesión redirige a /auth/login
// - /api/*        → sin sesión responde 401 (excepto rutas públicas)
//
// Verifica la firma del cookie auth_token (JWT HS256 con
// JWT_SECRET). Acepta también la sesión de Google/Auth.js
// (cookie authjs.session-token), cuya validación completa
// la hacen las rutas con auth() / getCurrentUser().
// ============================================================

// Rutas de API públicas (callback OAuth de Google, CSRF, etc.)
const RUTAS_API_PUBLICAS = ["/api/auth/"];

async function leerSesion(req: NextRequest): Promise<{
  autenticado: boolean;
  mustChangePassword: boolean;
}> {
  // --------------------------------------------------------
  // 1. Cookie auth_token (login por contraseña)
  // --------------------------------------------------------
  const token = req.cookies.get("auth_token")?.value;

  if (token) {
    const secret = process.env.JWT_SECRET;

    if (secret) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(secret),
          { algorithms: ["HS256"] }
        );

        return {
          autenticado: true,
          mustChangePassword:
            payload.mustChangePassword === true ||
            payload.mustChangePassword === 1,
        };
      } catch {
        // Token inválido o expirado: no da acceso por este medio.
        // Si hay sesión de Google válida, se usa abajo.
      }
    } else {
      console.error(
        "JWT_SECRET no está definido: no se puede verificar auth_token en el proxy."
      );
    }
  }

  // --------------------------------------------------------
  // 2. Sesión Auth.js / Google
  //    (la ruta destino revalida contra la base de datos)
  // --------------------------------------------------------
  const authCookie =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (authCookie) {
    return { autenticado: true, mustChangePassword: false };
  }

  return { autenticado: false, mustChangePassword: false };
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --------------------------------------------------------
  // Rutas públicas (OAuth de Google, CSRF, signin)
  // --------------------------------------------------------
  if (RUTAS_API_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }

  const sesion = await leerSesion(req);

  // --------------------------------------------------------
  // SIN SESIÓN
  // --------------------------------------------------------
  if (!sesion.autenticado) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const url = new URL("/auth/login", req.url);
    url.searchParams.set("error", "Debe iniciar sesión para acceder");
    return NextResponse.redirect(url);
  }

  // --------------------------------------------------------
  // CAMBIO FORZADO DE CONTRASEÑA
  // Solo aplica al login por contraseña (lleva el claim).
  // --------------------------------------------------------
  if (sesion.mustChangePassword && pathname.startsWith("/dashboard")) {
    const accept = req.headers.get("accept") || "";

    if (accept.includes("text/html")) {
      const url = new URL("/auth/cambiar-contrasena", req.url);
      return NextResponse.redirect(url);
    }

    return NextResponse.json(
      { error: "Debe cambiar su contraseña para continuar" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
