import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    let currentUser = await getCurrentUser();

    if (!currentUser) {
      const tokenUser = await getCurrentUserFromToken();

      if (tokenUser?.email) {
        currentUser = await getUserByEmail(tokenUser.email);
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no autenticado",
        },
        { status: 401 }
      );
    }

    const actorUserId = currentUser.userId;

    const pool = await getPool();

    const result = await pool
      .request()
      .input("ActorUserId", sql.UniqueIdentifier, actorUserId)
      .query(`
      SELECT
            Numero,
            Texto,
            Calificacion,
            Nivel,
			US.FullName,
			SAD.Cargo
        FROM dbo.Matriz_SistemaAdministrativoDetalle SAD
		LEFT JOIN dbo.Usuarios_Dgci US ON SAD.ActorUserId=US.UserId
        WHERE ActorUserId = @ActorUserId
          AND Calificacion < 5
        ORDER BY Numero
      `);

    return NextResponse.json({
      ok: true,
      data: result.recordset,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}