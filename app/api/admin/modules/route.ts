import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getPool } from "@/lib/db";

function requireAdmin(payload: any) {
  const role = String(payload?.role || "").toLowerCase();
  if (role !== "administrador") throw new Error("No autorizado");
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as any;
    requireAdmin(payload);

    const pool = await getPool();

    const modulesRes = await pool.request().query(`
           SELECT ModuleId, ModuleKey, ModuleName
      FROM Modulos_Dgci
      ORDER BY  ModuleId ASC
    `);

    const subRes = await pool.request().query(`
      SELECT SubModuleId, ModuleId, SubModuleKey, SubModuleName, SortOrder
      FROM submodulos_dgci
      ORDER BY SortOrder ASC, SubModuleName ASC
    `);

    // Agrupar submódulos por ModuleId
    const subByModule = new Map<string, any[]>();
    for (const s of subRes.recordset) {
      const k = String(s.ModuleId);

      if (!subByModule.has(k)) subByModule.set(k, []);
      subByModule.get(k)!.push({
        id: String(s.SubModuleId),
        key: s.SubModuleKey,
        name: s.SubModuleName,
      });
    }

    // Formatear módulos
    const modules = modulesRes.recordset.map((m: any) => ({
      id: String(m.ModuleId),
      key: m.ModuleKey,
      name: m.ModuleName,
      submodules: subByModule.get(String(m.ModuleId)) ?? [],
    }));

    return NextResponse.json({ modules });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}