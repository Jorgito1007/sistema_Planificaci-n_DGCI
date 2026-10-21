import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

/* ============================================================
   TIPOS
============================================================ */

export type ResultadoAccesoModulo = {
  ok: boolean;

  puedeAcceder: boolean;

  esExento: boolean;

  moduleId: number;

  actorUserId: string | null;

  role: string | null;

  roleName: string | null;

  estado:
    | "ACCESO_ADMINISTRATIVO"
    | "NO_CONTROLADO"
    | "ABIERTO"
    | "CERRADO"
    | "PROGRAMADO"
    | "VENCIDO"
    | "SIN_APERTURA"
    | "SIN_ROL"
    | "NO_AUTENTICADO"
    | "ERROR";

  message: string;

  apertura?: {
    id: number;
    fechaInicio: Date | null;
    fechaCierre: Date | null;
    observaciones: string | null;
  } | null;
};

/* ============================================================
   VERIFICAR ACCESO A MÓDULO

   Módulos controlados:
   2 = Matriz por Componentes
   6 = Matriz Sistema Administrativo

   Exentos:
   administrador
   subadministrador
============================================================ */

export async function verificarAccesoModulo(
  moduleId: number
): Promise<ResultadoAccesoModulo> {
  try {
    /* ========================================================
       USUARIO AUTENTICADO
    ======================================================== */

    const actorUserId =
      await getCurrentUserId();

    if (!actorUserId) {
      return {
        ok: false,
        puedeAcceder: false,
        esExento: false,
        moduleId,
        actorUserId: null,
        role: null,
        roleName: null,
        estado: "NO_AUTENTICADO",
        message: "Usuario no autenticado.",
        apertura: null,
      };
    }

    /* ========================================================
       CONEXIÓN
    ======================================================== */

    const pool = await getPool();

    /* ========================================================
       OBTENER ROL
    ======================================================== */

    const resultadoRol = await pool
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

    /* ========================================================
       SIN ROL
    ======================================================== */

    if (
      resultadoRol.recordset.length === 0
    ) {
      return {
        ok: false,
        puedeAcceder: false,
        esExento: false,
        moduleId,
        actorUserId,
        role: null,
        roleName: null,
        estado: "SIN_ROL",
        message:
          "El usuario no tiene un rol asignado.",
        apertura: null,
      };
    }

    const usuarioRol =
      resultadoRol.recordset[0];

    const role = String(
      usuarioRol.RoleKey || ""
    )
      .trim()
      .toLowerCase();

    const roleName = String(
      usuarioRol.RoleName || ""
    ).trim();

    /* ========================================================
       ADMINISTRADOR / SUBADMINISTRADOR
    ======================================================== */

    const esExento =
      role === "administrador" ||
      role === "subadministrador";

    if (esExento) {
      return {
        ok: true,
        puedeAcceder: true,
        esExento: true,
        moduleId,
        actorUserId,
        role,
        roleName,
        estado:
          "ACCESO_ADMINISTRATIVO",
        message:
          "El usuario posee acceso administrativo.",
        apertura: null,
      };
    }

    /* ========================================================
       MÓDULOS CONTROLADOS
    ======================================================== */

    const moduloControlado =
      moduleId === 2 ||
      moduleId === 6;

    /* ========================================================
       OTROS MÓDULOS
    ======================================================== */

    if (!moduloControlado) {
      return {
        ok: true,
        puedeAcceder: true,
        esExento: false,
        moduleId,
        actorUserId,
        role,
        roleName,
        estado: "NO_CONTROLADO",
        message:
          "El módulo no está sujeto al control de apertura.",
        apertura: null,
      };
    }

    /* ========================================================
       CONSULTAR APERTURA
    ======================================================== */

    const resultadoApertura =
      await pool.request().query(`
        SELECT TOP 1

            A.Id,
            A.FechaInicio,
            A.FechaCierre,
            A.Observaciones,
            A.Estado,

            CASE

                WHEN A.Estado = 0
                    THEN 'CERRADO'

                WHEN
                    CAST(GETDATE() AS DATE)
                    < CAST(A.FechaInicio AS DATE)
                    THEN 'PROGRAMADO'

                WHEN
                    CAST(GETDATE() AS DATE)
                    > CAST(A.FechaCierre AS DATE)
                    THEN 'VENCIDO'

                WHEN
                    A.Estado = 1
                    AND CAST(GETDATE() AS DATE)
                        BETWEEN
                            CAST(A.FechaInicio AS DATE)
                            AND
                            CAST(A.FechaCierre AS DATE)
                    THEN 'ABIERTO'

                ELSE 'CERRADO'

            END AS EstadoSistema

        FROM dbo.Apertura_sistema AS A

        ORDER BY
            A.Id DESC;
      `);

    /* ========================================================
       NO EXISTE APERTURA
    ======================================================== */

    if (
      resultadoApertura.recordset
        .length === 0
    ) {
      return {
        ok: true,
        puedeAcceder: false,
        esExento: false,
        moduleId,
        actorUserId,
        role,
        roleName,
        estado: "SIN_APERTURA",
        message:
          "El sistema se encuentra cerrado. No existe un período de apertura vigente.",
        apertura: null,
      };
    }

    const apertura =
      resultadoApertura.recordset[0];

    const estadoSistema =
      String(
        apertura.EstadoSistema || ""
      ) as ResultadoAccesoModulo["estado"];

    const puedeAcceder =
      estadoSistema === "ABIERTO";

    /* ========================================================
       MENSAJE
    ======================================================== */

    let message =
      "El módulo no se encuentra disponible.";

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
    }

    /* ========================================================
       RESPUESTA
    ======================================================== */

    return {
      ok: true,

      puedeAcceder,

      esExento: false,

      moduleId,

      actorUserId,

      role,

      roleName,

      estado:
        estadoSistema,

      message,

      apertura: {
        id: apertura.Id,

        fechaInicio:
          apertura.FechaInicio,

        fechaCierre:
          apertura.FechaCierre,

        observaciones:
          apertura.Observaciones,
      },
    };
  } catch (error) {
    console.error(
      "Error verificarAccesoModulo:",
      error
    );

    return {
      ok: false,

      puedeAcceder: false,

      esExento: false,

      moduleId,

      actorUserId: null,

      role: null,

      roleName: null,

      estado: "ERROR",

      message:
        "No fue posible verificar el estado de apertura del sistema.",

      apertura: null,
    };
  }
}