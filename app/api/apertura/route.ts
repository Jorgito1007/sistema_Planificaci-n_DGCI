import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPool,
  sql,
} from "@/lib/db";

import {
  getCurrentUserId,
} from "@/lib/current-user";

// ============================================================
// GET
// OBTENER HISTÓRICO DE APERTURAS
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // USUARIO AUTENTICADO
    // ========================================================

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
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
    // CONEXIÓN
    // ========================================================

    const pool =
      await getPool();

    // ========================================================
    // HISTÓRICO
    // ========================================================

    const result =
      await pool
        .request()
        .query(`
          SELECT
              A.Id,
              A.FechaInicio,
              A.FechaCierre,
              A.Observaciones,
              A.ActorUserId,
              A.Estado,
              A.CreateDay,

              ISNULL(
                  U.FullName,
                  'Usuario no disponible'
              ) AS Usuario

          FROM dbo.Apertura_sistema AS A

          LEFT JOIN dbo.Usuarios_Dgci AS U
              ON A.ActorUserId = U.UserId

          ORDER BY
              A.CreateDay DESC,
              A.Id DESC;
        `);

    // ========================================================
    // RESPUESTA
    // ========================================================

    return NextResponse.json({
      ok: true,
      data: result.recordset,
    });
  } catch (error: any) {
    console.error(
      "ERROR GET /api/apertura:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "Error al obtener el histórico de aperturas.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST
// CREAR NUEVA APERTURA
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // USUARIO AUTENTICADO
    // ========================================================

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
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
    // BODY
    // ========================================================

    const body =
      await req.json();

    const {
      fechaInicio,
      fechaCierre,
      observaciones,
    } = body;

    // ========================================================
    // VALIDACIONES
    // ========================================================

    if (
      !fechaInicio ||
      !fechaCierre
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe indicar la fecha de inicio y la fecha de cierre.",
        },
        {
          status: 400,
        }
      );
    }

    const inicio =
      new Date(fechaInicio);

    const cierre =
      new Date(fechaCierre);

    if (
      isNaN(inicio.getTime()) ||
      isNaN(cierre.getTime())
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Las fechas proporcionadas no son válidas.",
        },
        {
          status: 400,
        }
      );
    }

    if (cierre < inicio) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "La fecha de cierre no puede ser anterior a la fecha de inicio.",
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
    // VERIFICAR SI YA EXISTE UNA APERTURA ACTIVA
    // ========================================================

    const aperturaActiva =
      await pool
        .request()
        .query(`
          SELECT TOP 1
              Id,
              FechaInicio,
              FechaCierre
          FROM dbo.Apertura_sistema
          WHERE Estado = 1
          ORDER BY Id DESC;
        `);

    if (
      aperturaActiva.recordset
        .length > 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Ya existe una apertura activa. Debe cerrarla antes de crear una nueva.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // INSERTAR APERTURA
    // ========================================================

    const result =
      await pool
        .request()

        .input(
          "FechaInicio",
          sql.Date,
          fechaInicio
        )

        .input(
          "FechaCierre",
          sql.Date,
          fechaCierre
        )

        .input(
          "Observaciones",
          sql.NVarChar(1000),
          observaciones?.trim() ||
            null
        )

        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )

        .query(`
          INSERT INTO dbo.Apertura_sistema
          (
              FechaInicio,
              FechaCierre,
              Observaciones,
              ActorUserId,
              Estado
          )
          OUTPUT
              INSERTED.Id,
              INSERTED.FechaInicio,
              INSERTED.FechaCierre,
              INSERTED.Observaciones,
              INSERTED.ActorUserId,
              INSERTED.Estado,
              INSERTED.CreateDay
          VALUES
          (
              @FechaInicio,
              @FechaCierre,
              @Observaciones,
              @ActorUserId,
              1
          );
        `);

    // ========================================================
    // RESPUESTA
    // ========================================================

    return NextResponse.json(
      {
        ok: true,

        message:
          "La apertura del sistema fue registrada correctamente.",

        data:
          result.recordset[0],
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "ERROR POST /api/apertura:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error?.message ||
          "Error al registrar la apertura del sistema.",
      },
      {
        status: 500,
      }
    );
  }
}