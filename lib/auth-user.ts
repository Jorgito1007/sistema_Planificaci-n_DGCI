import { cookies } from "next/headers";
import { getPool } from "@/lib/db";

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Ajusta este nombre según tu sistema de login
    const userEmail = cookieStore.get("user_email")?.value;

    if (!userEmail) return null;

    const pool = await getPool();

    const result = await pool
      .request()
      .input("Email", userEmail)
      .query(`
        SELECT TOP 1 UserId
        FROM Usuarios_Dgci
        WHERE Email = @Email
      `);

    return result.recordset[0]?.UserId ?? null;
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
}