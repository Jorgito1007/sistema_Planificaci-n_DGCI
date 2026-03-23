import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const userId = payload.userId || payload.UserId || payload.id || payload.sub;
    const role = String(payload.role || "").toLowerCase();

    if (role === "administrador") {
      return NextResponse.json({
        role,
        allowAll: true,
        modules: [],
        submodules: [],
      });
    }

    const pool = await getPool();

    const modRes = await pool.request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT ModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosModulosPermisos
        WHERE UserId=@UserId AND CanView=1
      `);

    const subRes = await pool.request()
      .input("UserId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT SubModuleId, CanView, CanCreate, CanEdit, CanDelete
        FROM dbo.usuariosSubmodulospermisos
        WHERE UserId=@UserId AND CanView=1
      `);

    return NextResponse.json({
      role,
      allowAll: false,
      modules: modRes.recordset,
      submodules: subRes.recordset,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}