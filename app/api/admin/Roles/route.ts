import { NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        RoleId,
        RoleKey,
        RoleName
      FROM dbo.Roles_Dgci
      ORDER BY RoleName
    `);

    return NextResponse.json(result.recordset);
    
  } catch (error: any) {
    console.error("ERROR GET /api/admin/roles:", error);

    return NextResponse.json(
      { error: "Error al cargar roles", detail: "Contacte al administrador del sistema." },
      { status: 500 }
    );
  }
}