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
// VERIFICAR ACCESO SEGÚN MÓDULO Y APERTURA DEL SISTEMA
//
// EJEMPLO:
// /api/apertura/acceso?moduleId=2
// ============================================================

export async function GET(
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
          puedeAcceder: false,
          message:
            "Usuario no autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // MODULE ID
    // ========================================================

    const { searchParams } =
      new URL(req.url);

    const moduleIdParam =
      searchParams.get("moduleId");

    const moduleId =
      Number(moduleIdParam);

    if (
      !moduleIdParam ||
      Number.isNaN(moduleId) ||
      moduleId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          puedeAcceder: false,
          message:
            "Debe indicar un ModuleId válido.",
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
    // OBTENER ROL DEL USUARIO
    // ========================================================

    const resultadoRol =
      await pool
        .request()

        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserId
        )

        .query(`
          SELECT TOP 1
              UR.UserId,
              UR.RoleId,
              R.RoleKey,
              R.RoleName
          FROM dbo.UserRoles_Dgci AS UR

          INNER JOIN dbo.Roles_Dgci AS R
              ON UR.RoleId = R.RoleId

          WHERE UR.UserId = @ActorUserId

          ORDER BY
              UR.AssignedAt DESC;
        `);

    // ========================================================
    // USUARIO SIN ROL
    // ========================================================

    if (
      resultadoRol.recordset.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          puedeAcceder: false,
          message:
            "El usuario no tiene un rol asignado.",
        },
        {
          status: 403,
        }
      );
    }

    const usuarioRol =
      resultadoRol.recordset[0];

    // ========================================================
    // NORMALIZAR ROL
    // ========================================================

    const role =
      String(
        usuarioRol.RoleKey || ""
      )
        .trim()
        .toLowerCase();

    // ========================================================
    // ADMINISTRADOR / SUBADMINISTRADOR
    // ========================================================

    const esExento =
      role === "administrador" ||
      role === "subadministrador";

    // ========================================================
    // SI ES ADMIN O SUBADMIN
    // SIEMPRE PUEDE ACCEDER
    // ========================================================

    if (esExento) {
      return NextResponse.json({
        ok: true,

        puedeAcceder: true,

        esExento: true,

        moduleId,

        role,

        roleName:
          usuarioRol.RoleName,

        estado:
          "ACCESO_ADMINISTRATIVO",

        sistemaAbierto: true,

        message:
          "El usuario posee acceso administrativo al módulo.",

        apertura: null,
      });
    }

    // ========================================================
    // MÓDULOS CONTROLADOS
    // ========================================================

    const moduloControlado =
      moduleId === 2 ||
      moduleId === 6;

    // ========================================================
    // SI NO ES MODULEID 1 O 2
    // NO SE APLICA APERTURA / CIERRE
    // ========================================================

    if (!moduloControlado) {
      return NextResponse.json({
        ok: true,

        puedeAcceder: true,

        esExento: false,

        moduleId,

        role,

        roleName:
          usuarioRol.RoleName,

        estado:
          "NO_CONTROLADO",

        sistemaAbierto: true,

        message:
          "Este módulo no está sujeto al control de apertura y cierre.",

        apertura: null,
      });
    }

    // ========================================================
    // BUSCAR ÚLTIMA APERTURA
    // ========================================================

    const resultadoApertura =
      await pool
        .request()
        .query(`
          SELECT TOP 1
              A.Id,
              A.FechaInicio,
              A.FechaCierre,
              A.Observaciones,
              A.Estado,
              A.ActorUserId,
              A.CreateDay,

              CASE

                  WHEN A.Estado = 0
                  THEN 'CERRADO'

                  WHEN
                      CAST(GETDATE() AS DATE)
                      < A.FechaInicio
                  THEN 'PROGRAMADO'

                  WHEN
                      CAST(GETDATE() AS DATE)
                      > A.FechaCierre
                  THEN 'VENCIDO'

                  WHEN
                      A.Estado = 1
                      AND CAST(GETDATE() AS DATE)
                          BETWEEN
                              A.FechaInicio
                              AND A.FechaCierre
                  THEN 'ABIERTO'

                  ELSE 'CERRADO'

              END AS EstadoSistema

          FROM dbo.Apertura_sistema AS A

          ORDER BY
              A.Id DESC;
        `);

    // ========================================================
    // NO HAY APERTURA
    // ========================================================

    if (
      resultadoApertura.recordset.length === 0
    ) {
      return NextResponse.json({
        ok: true,

        puedeAcceder: false,

        esExento: false,

        moduleId,

        role,

        roleName:
          usuarioRol.RoleName,

        estado:
          "SIN_APERTURA",

        sistemaAbierto: false,

        message:
          "El módulo se encuentra cerrado. No existe un período de apertura vigente.",

        apertura: null,
      });
    }

    // ========================================================
    // APERTURA ENCONTRADA
    // ========================================================

    const apertura =
      resultadoApertura.recordset[0];

    const estadoSistema =
      String(
        apertura.EstadoSistema
      );

    const sistemaAbierto =
      estadoSistema === "ABIERTO";

    // ========================================================
    // MENSAJE SEGÚN ESTADO
    // ========================================================

    let message = "";

    switch (estadoSistema) {
      case "ABIERTO":
        message =
          "El módulo se encuentra habilitado.";
        break;

      case "PROGRAMADO":
        message =
          "El período está programado, pero todavía no ha iniciado.";
        break;

      case "VENCIDO":
        message =
          "El período de acceso al módulo ha finalizado.";
        break;

      case "CERRADO":
        message =
          "El módulo se encuentra cerrado.";
        break;

      default:
        message =
          "El módulo no se encuentra disponible.";
        break;
    }

    // ========================================================
    // RESPUESTA FINAL
    // ========================================================

    return NextResponse.json({
      ok: true,

      puedeAcceder:
        sistemaAbierto,

      esExento: false,

      moduleId,

      role,

      roleName:
        usuarioRol.RoleName,

      estado:
        estadoSistema,

      sistemaAbierto,

      message,

      apertura: {
        id:
          apertura.Id,

        fechaInicio:
          apertura.FechaInicio,

        fechaCierre:
          apertura.FechaCierre,

        observaciones:
          apertura.Observaciones,

        estadoRegistro:
          Boolean(
            apertura.Estado
          ),

        createDay:
          apertura.CreateDay,
      },
    });
  } catch (error: any) {
    console.error(
      "ERROR GET /api/apertura/acceso:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        puedeAcceder: false,

        esExento: false,

        sistemaAbierto: false,

        estado: "ERROR",

        message:
          error?.message ||
          "Ocurrió un error al verificar el acceso al módulo.",
      },
      {
        status: 500,
      }
    );
  }
}