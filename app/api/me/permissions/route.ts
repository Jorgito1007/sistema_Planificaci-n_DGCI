import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    let userId: string | null = null;
    let role = "";

    // 1. Intentar con sesión de Google
    const session = await auth();

    if (session?.user?.email) {
      const pool = await getPool();

      const userRes = await pool
        .request()
        .input("Email", sql.VarChar, session.user.email)
        .query(`
          SELECT TOP 1
            u.UserId,
            rr.RoleName
          FROM dbo.Usuarios_Dgci u
          INNER JOIN dbo.UserRoles_Dgci ur ON u.UserId = ur.UserId
          INNER JOIN dbo.Roles_Dgci rr ON ur.RoleId = rr.RoleId
          WHERE u.Email = @Email
        `);

      const row = userRes.recordset[0];

      if (!row) {
        return NextResponse.json({ error: "Usuario no autorizado" }, { status: 401 });
      }

      userId = row.UserId;
      role = String(row.RoleName || "").toLowerCase();
    }

    // 2. Si no hay Google, intentar con JWT tradicional
    if (!userId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;

      if (!token) {
        return NextResponse.json({ error: "No auth" }, { status: 401 });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      userId = payload.userId || payload.UserId || payload.id || payload.sub;
      role = String(payload.role || "").toLowerCase();
    }

    if (!userId) {
      return NextResponse.json({ error: "Usuario no identificado" }, { status: 401 });
    }

    // 3. Si es administrador → acceso total
    if (role === "administrador") {
      return NextResponse.json({
        role,
        allowAll: true,
        modules: [],
        submodules: [],
      });
    }

    // 4. Cargar permisos normales
    const pool = await getPool();

    const modRes = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT ModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosModulosPermisos
        WHERE UserId = @UserId AND CanView = 1
      `);

    const subRes = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT SubModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosSubmodulospermisos
        WHERE UserId = @UserId AND CanView = 1
      `);

    return NextResponse.json({
      role,
      allowAll: false,
      modules: modRes.recordset ?? [],
      submodules: subRes.recordset ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}