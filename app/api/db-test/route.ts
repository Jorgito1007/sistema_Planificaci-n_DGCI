import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT GETDATE() AS now");
    return NextResponse.json({ ok: true, now: r.recordset[0].now });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}