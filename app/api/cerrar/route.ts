import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPool,
  sql,
} from "@/lib/db";

import { getCurrentUser } from "@/lib/current-user";

// ============================================================
// POST
// CERRAR UNA APERTURA DEL SISTEMA
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // USUARIO AUTENTICADO
    // ========================================================

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Usuario no autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // SOLO ADMINISTRACIÓN
    // Cerrar el período del sistema es una función de
    // administrador / subadministrador.
    // ========================================================

    const roleKey = String(
      me.roleKey || me.role || ""
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    if (
      roleKey !== "administrador" &&
      roleKey !== "subadministrador"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No tiene permiso para cerrar el período del sistema.",
        },
        {
          status: 403,
        }
      );
    }

    const actorUserId = me.userId;

    // ========================================================
    // OBTENER ID
    // ========================================================

    const body =
      await req.json();

    const id =
      Number(body.id);

    if (
      !id ||
      Number.isNaN(id)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe indicar una apertura válida.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // CONEXIÓN
    // ========================================================

    const pool =
      await getPool();

    // ========================================================
    // BUSCAR APERTURA
    // ========================================================

    const apertura =
      await pool
        .request()

        .input(
          "Id",
          sql.Int,
          id
        )

        .query(`
          SELECT TOP 1
              Id,
              FechaInicio,
              FechaCierre,
              Observaciones,
              ActorUserId,
              Estado,
              CreateDay
          FROM dbo.Apertura_sistema
          WHERE Id = @Id;
        `);

    // ========================================================
    // NO EXISTE
    // ========================================================

    if (
      apertura.recordset.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "La apertura seleccionada no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const registro =
      apertura.recordset[0];

    // ========================================================
    // YA ESTÁ CERRADA
    // ========================================================

    if (!registro.Estado) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta apertura ya se encuentra cerrada.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // CERRAR
    // ========================================================

    const resultado =
      await pool
        .request()

        .input(
          "Id",
          sql.Int,
          id
        )

        .query(`
          UPDATE dbo.Apertura_sistema

          SET Estado = 0

          OUTPUT
              INSERTED.Id,
              INSERTED.FechaInicio,
              INSERTED.FechaCierre,
              INSERTED.Observaciones,
              INSERTED.ActorUserId,
              INSERTED.Estado,
              INSERTED.CreateDay

          WHERE
              Id = @Id
              AND Estado = 1;
        `);

    // ========================================================
    // VERIFICAR ACTUALIZACIÓN
    // ========================================================

    if (
      resultado.recordset.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No fue posible cerrar la apertura.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // RESPUESTA
    // ========================================================

    return NextResponse.json({
      ok: true,

      message:
        "El período del sistema fue cerrado correctamente.",

      data:
        resultado.recordset[0],
    });
  } catch (error: any) {
    console.error(
      "ERROR POST /api/apertura/cerrar:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          "Ocurrió un error al cerrar el período del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}