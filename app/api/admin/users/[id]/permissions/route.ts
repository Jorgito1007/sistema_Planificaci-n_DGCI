import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

async function requireAdmin() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (String(payload.role || "").toLowerCase() !== "administrador") return null;
  return payload;
}

export async function GET(req: Request) {
  try {
    const me = await requireAdmin();
    if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const userId = parts[3]; // api/admin/users/{id}/permissions

    // validar GUID básico
    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(userId)) {
      return NextResponse.json(
        { error: "UserId inválido", detail: `No es GUID: ${userId}` },
        { status: 400 }
      );
    }

    const pool = await getPool();
  
      // ✅ MÓDULOS permitidos
    const modRes = await pool.request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT ModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosModulosPermisos
        WHERE UserId=@UserId AND CanView=1
      `);

    const res = await pool
      .request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT SubModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosSubmodulospermisos
        WHERE UserId=@UserId
        ORDER BY SubModuleId
      `);

    return NextResponse.json({ permissions: res.recordset || [] });
  } catch (e: any) {
    console.error("PERMS ERROR:", e);
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}