import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";

import {
  getCurrentUser,
  getCurrentUserFromToken,
  getUserByEmail,
} from "@/lib/current-user";

import {
  verificarAccesoModulo,
} from "@/lib/verificar-acceso-modulo";

/* ============================================================
   POST
   GUARDAR MATRIZ SISTEMA ADMINISTRATIVO

   ModuleId = 6
============================================================ */

export async function POST(req: NextRequest) {
  try {
    console.log("ENTRÓ A GUARDAR MATRIZ");

    /* ========================================================
       1. VERIFICAR APERTURA DEL SISTEMA

       ModuleId = 6
       Matriz Sistema Administrativo

       administrador / subadministrador:
       acceso permanente.

       demás usuarios:
       solamente pueden guardar si el período está ABIERTO.
    ======================================================== */

    const acceso = await verificarAccesoModulo(6);

    if (!acceso.puedeAcceder) {
      const status =
        acceso.estado === "NO_AUTENTICADO"
          ? 401
          : 403;

      console.log(
        "ACCESO DENEGADO POR APERTURA:",
        acceso.estado
      );

      return NextResponse.json(
        {
          ok: false,
          error: acceso.message,
          message: acceso.message,
          estado: acceso.estado,
          moduleId: 6,
          accesoDenegado: true,
        },
        {
          status,
        }
      );
    }

    /* ========================================================
       2. LEER BODY
    ======================================================== */

    const body = await req.json();

    console.log("BODY:", body);

    /* ========================================================
       3. CONEXIÓN
    ======================================================== */

    const pool = await getPool();

    /* ========================================================
       4. OBTENER USUARIO ACTUAL

       Conservamos tu mecanismo actual.
    ======================================================== */

    let currentUser =
      await getCurrentUser();

    if (!currentUser) {
      const tokenUser =
        await getCurrentUserFromToken();

      if (tokenUser?.email) {
        currentUser =
          await getUserByEmail(
            tokenUser.email
          );
      }
    }

    console.log(
      "CURRENT USER:",
      currentUser
    );

    /* ========================================================
       5. VALIDAR AUTENTICACIÓN
    ======================================================== */

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       6. USUARIO ACTUAL
    ======================================================== */

    const actorUserId =
      currentUser.userId;

    /* ========================================================
       7. NORMALIZAR ROL
    ======================================================== */

    const roleKey =
      String(
        currentUser.roleKey ||
          currentUser.role ||
          ""
      )
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "");

    /* ========================================================
       8. ADMIN / SUBADMIN
    ======================================================== */

    const isAdmin =
      roleKey === "administrador" ||
      roleKey === "subadministrador";

    /* ========================================================
       9. VALIDAR SUBMODULEKEY
    ======================================================== */

    if (!body.subModuleKey) {
      return NextResponse.json(
        {
          error:
            "Falta subModuleKey",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       10. VERIFICAR PERMISO DEL SUBMÓDULO

       Esta lógica se conserva.

       La apertura determina:
       ¿puede trabajar ahora?

       El permiso determina:
       ¿puede trabajar en este submódulo?
    ======================================================== */

    const permiso =
      await pool
        .request()

        .input(
          "UserId",
          sql.UniqueIdentifier,
          actorUserId
        )

        .input(
          "SubModuleKey",
          sql.VarChar(100),
          body.subModuleKey
        )

        .query(`
          SELECT TOP 1
              usp.CanView

          FROM dbo.usuariosSubmodulospermisos AS usp

          INNER JOIN dbo.submodulos_dgci AS s
              ON s.SubModuleId =
                 usp.SubModuleId

          WHERE
              usp.UserId = @UserId

              AND LOWER(s.SubModuleKey) =
                  LOWER(@SubModuleKey)

              AND usp.CanView = 1;
        `);

    console.log(
      "PERMISOS:",
      permiso.recordset
    );

    /* ========================================================
       11. VALIDAR PERMISO

       Admin/subadmin no requieren permiso
       de submódulo.
    ======================================================== */

    if (
      !isAdmin &&
      permiso.recordset.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No tiene permiso para guardar este submódulo",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       12. CABECERA DE LA MATRIZ
    ======================================================== */

    const cabecera =
      await pool
        .request()

        .input(
          "SubModuleKey",
          sql.VarChar(100),
          body.subModuleKey
        )

        .execute(
          "sp_GuardarMatrizSistemaAdministrativoCabecera"
        );

    const matrizId =
      cabecera.recordset?.[0]
        ?.MatrizSistemaAdministrativoId;

    /* ========================================================
       13. VALIDAR MATRIZ ID
    ======================================================== */

    if (!matrizId) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "No se pudo obtener el ID de la matriz.",
        },
        {
          status: 500,
        }
      );
    }

    /*
    ============================================================
    Actualmente NO eliminamos el detalle.

    await pool
      .request()
      .input(
        "MatrizSistemaAdministrativoId",
        sql.Int,
        matrizId
      )
      .execute(
        "sp_EliminarDetalleMatrizSistemaAdministrativo"
      );
    ============================================================
    */

    /* ========================================================
       14. ARRAY DE PREGUNTAS GUARDADAS
    ======================================================== */

    const preguntasGuardadas: {
      id: number;
      numero: string;
    }[] = [];

    /* ========================================================
       15. RECORRER PREGUNTAS
    ======================================================== */

    for (
      const p of body.preguntas || []
    ) {
      /* ======================================================
         ID DE PREGUNTA
      ====================================================== */

      const questionId =
        Number(
          p.id ||
            p.Id ||
            0
        );

      /* ======================================================
         DOCUMENT ID
      ====================================================== */

      const documentId =
        p.documentId != null &&
        Number(p.documentId) > 0
          ? Number(p.documentId)
          : null;

      /* ======================================================
         VALIDAR NUMERACIÓN DUPLICADA
      ====================================================== */

      const existeNumero =
        await pool
          .request()

          .input(
            "MatrizSistemaAdministrativoId",
            sql.Int,
            matrizId
          )

          .input(
            "Numero",
            sql.VarChar(30),
            p.numero
          )

          .input(
            "QuestionId",
            sql.Int,
            questionId
          )

          .query(`
            SELECT TOP 1
                Id

            FROM dbo.Matriz_SistemaAdministrativoDetalle

            WHERE
                MatrizSistemaAdministrativoId =
                    @MatrizSistemaAdministrativoId

                AND Numero =
                    @Numero

                AND (
                    @QuestionId = 0
                    OR
                    Id <> @QuestionId
                );
          `);

      if (
        existeNumero.recordset.length > 0
      ) {
        return NextResponse.json(
          {
            ok: false,

            message:
              `Ya existe una pregunta con la numeración ${p.numero}.`,
          },
          {
            status: 409,
          }
        );
      }

      /* ======================================================
         ACTOR USER ID A GUARDAR
      ====================================================== */

      let actorUserIdParaGuardar =
        actorUserId;

      /* ======================================================
         ADMIN EDITANDO PREGUNTA EXISTENTE

         Conservamos el ActorUserId original.
      ====================================================== */

      if (
        isAdmin &&
        questionId > 0
      ) {
        const original =
          await pool
            .request()

            .input(
              "QuestionId",
              sql.Int,
              questionId
            )

            .query(`
              SELECT TOP 1
                  ActorUserId

              FROM dbo.Matriz_SistemaAdministrativoDetalle

              WHERE
                  Id = @QuestionId;
            `);

        actorUserIdParaGuardar =
          original.recordset[0]
            ?.ActorUserId ||
          actorUserId;
      }

      /* ======================================================
         USUARIO NORMAL

         Verificar permiso específico
         sobre la pregunta.
      ====================================================== */

      if (
        !isAdmin &&
        questionId > 0
      ) {
        const asignada =
          await pool
            .request()

            .input(
              "UserId",
              sql.UniqueIdentifier,
              actorUserId
            )

            .input(
              "QuestionId",
              sql.Int,
              questionId
            )

            .query(`
              SELECT TOP 1
                  QuestionId

              FROM dbo.usuariosPreguntasPermisos

              WHERE
                  UserId = @UserId

                  AND QuestionId =
                      @QuestionId

                  AND CanEdit = 1;
            `);

        if (
          asignada.recordset.length > 0
        ) {
          actorUserIdParaGuardar =
            actorUserId;
        }
      }

      /* ======================================================
         16. INSERTAR / ACTUALIZAR DETALLE
      ====================================================== */

      await pool
        .request()

        .input(
          "Id",
          sql.Int,
          questionId > 0
            ? questionId
            : null
        )

        .input(
          "MatrizSistemaAdministrativoId",
          sql.Int,
          matrizId
        )

        .input(
          "Numero",
          sql.VarChar(30),
          p.numero
        )

        .input(
          "Texto",
          sql.NVarChar(sql.MAX),
          p.texto
        )

        .input(
          "Cargo",
          sql.NVarChar(255),
          p.cargo || ""
        )

        .input(
          "Existe",
          sql.Int,
          p.existe ?? 0
        )

        .input(
          "Aprobado",
          sql.Int,
          p.aprobado ?? 0
        )

        .input(
          "Difundido",
          sql.Int,
          p.difundido ?? 0
        )

        .input(
          "EstaPresente",
          sql.VarChar(2),
          p.estaPresente || "NO"
        )

        .input(
          "Implementado",
          sql.Int,
          p.implementado ?? 0
        )

        .input(
          "Actualizado",
          sql.Int,
          p.actualizado ?? 0
        )

        .input(
          "EstaFuncionando",
          sql.VarChar(2),
          p.estaFuncionando || "NO"
        )

        .input(
          "Calificacion",
          sql.Int,
          p.calificacion ?? 0
        )

        .input(
          "Nivel",
          sql.VarChar(20),
          p.nivel || ""
        )

        .input(
          "TipoDocumento",
          sql.NVarChar(255),
          p.tipoDocumento || ""
        )

        .input(
          "DocumentId",
          sql.Int,
          documentId
        )

        .input(
          "Descripcion",
          sql.NVarChar(sql.MAX),
          p.descripcion || ""
        )

        .input(
          "FechaEmision",
          sql.Date,
          p.fechaEmision || null
        )

        .input(
          "Interna",
          sql.NVarChar(sql.MAX),
          p.interna || null
        )

        .input(
          "Externa",
          sql.NVarChar(sql.MAX),
          p.externa || null
        )

        .input(
          "ActorUserId",
          sql.UniqueIdentifier,
          actorUserIdParaGuardar
        )

        .execute(
          "sp_InsertarMatrizSistemaAdministrativoDetalle"
        );

      /* ======================================================
         17. OBTENER ID GUARDADO
      ====================================================== */

      let idGuardado =
        questionId;

      /*
       * Si era una pregunta nueva,
       * buscamos el ID generado.
       */

      if (
        !idGuardado ||
        idGuardado <= 0
      ) {
        const nuevaPregunta =
          await pool
            .request()

            .input(
              "MatrizSistemaAdministrativoId",
              sql.Int,
              matrizId
            )

            .input(
              "Numero",
              sql.VarChar(30),
              p.numero
            )

            .query(`
              SELECT TOP 1
                  Id

              FROM dbo.Matriz_SistemaAdministrativoDetalle

              WHERE
                  MatrizSistemaAdministrativoId =
                      @MatrizSistemaAdministrativoId

                  AND Numero =
                      @Numero

              ORDER BY
                  Id DESC;
            `);

        idGuardado =
          Number(
            nuevaPregunta
              .recordset[0]?.Id ||
              0
          );
      }

      /* ======================================================
         18. VALIDAR ID
      ====================================================== */

      if (!idGuardado) {
        throw new Error(
          `No se pudo obtener el Id de la pregunta ${p.numero}.`
        );
      }

      /* ======================================================
         19. AGREGAR AL RESULTADO
      ====================================================== */

      preguntasGuardadas.push({
        id: idGuardado,

        numero:
          String(p.numero),
      });
    }

    /* ========================================================
       20. RESPUESTA EXITOSA
    ======================================================== */

    return NextResponse.json({
      ok: true,

      matrizId,

      preguntas:
        preguntasGuardadas,
    });
  } catch (error: any) {
    console.error(
      "Error guardando matriz:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error?.message ||
          "Ocurrió un error al guardar la matriz.",
      },
      {
        status: 500,
      }
    );
  }
}