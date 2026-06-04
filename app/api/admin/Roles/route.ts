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
    return NextResponse.json(
      { error: "Error al cargar roles", detail: error.message },
      { status: 500 }
    );
  }
}