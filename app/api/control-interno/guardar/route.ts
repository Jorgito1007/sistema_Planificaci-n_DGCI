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
   GUARDAR EVALUACIÓN POR COMPONENTES

   ModuleId = 2

   SEGURIDAD:
   - Administrador / Subadministrador:
       puede administrar estructura completa.
   - Usuario normal:
       necesita CanEdit en el principio
       Y CanEdit en cada pregunta.
============================================================ */

export async function POST(req: NextRequest) {
  try {
    /* ========================================================
       1. VERIFICAR APERTURA DEL SISTEMA
    ======================================================== */

    const acceso = await verificarAccesoModulo(2);

    if (!acceso.puedeAcceder) {
      const status =
        acceso.estado === "NO_AUTENTICADO"
          ? 401
          : 403;

      return NextResponse.json(
        {
          ok: false,
          error: acceso.message,
          message: acceso.message,
          estado: acceso.estado,
          moduleId: 2,
          accesoDenegado: true,
        },
        {
          status,
        }
      );
    }

    /* ========================================================
       2. BODY
    ======================================================== */

    const body = await req.json();

    if (!body.subModuleKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "Falta subModuleKey",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.principioId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Falta principioId",
        },
        {
          status: 400,
        }
      );
    }

    if (!Array.isArray(body.preguntas)) {
      return NextResponse.json(
        {
          ok: false,
          message: "El listado de preguntas no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       3. CONEXIÓN
    ======================================================== */

    const pool = await getPool();

    /* ========================================================
       4. USUARIO ACTUAL
    ======================================================== */

    let currentUser = await getCurrentUser();

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

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const actorUserId =
      currentUser.userId;

    if (!actorUserId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se pudo identificar el usuario actual.",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       5. ROL
    ======================================================== */

    const role = String(
      currentUser.roleKey ||
      currentUser.role ||
      ""
    )
      .trim()
      .toLowerCase();

    const esAdministrador =
      role === "administrador" ||
      role === "subadministrador";

    /* ========================================================
       6. RESOLVER SUBMODULE ID

       Necesitamos el ID para validar permisos
       de preguntas.
    ======================================================== */

    const subModuleResult =
      await pool
        .request()
        .input(
          "SubModuleKey",
          sql.VarChar(100),
          body.subModuleKey
        )
        .query(`
          SELECT TOP 1
              SubModuleId,
              ModuleId,
              SubModuleKey

          FROM dbo.submodulos_dgci

          WHERE
              LOWER(SubModuleKey) =
              LOWER(@SubModuleKey)

              AND ModuleId = 2;
        `);

    if (
      subModuleResult.recordset.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El submódulo indicado no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const subModuleId = Number(
      subModuleResult.recordset[0]
        .SubModuleId
    );

    /* ========================================================
       7. USUARIO NORMAL:
          VALIDAR CANEDIT SOBRE EL PRINCIPIO

       IMPORTANTE:
       Para guardar ya NO basta CanView.

       CanView = visualizar
       CanEdit = modificar
    ======================================================== */

    if (!esAdministrador) {
      const permisoPrincipio =
        await pool
          .request()

          .input(
            "UserId",
            sql.UniqueIdentifier,
            actorUserId
          )

          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )

          .input(
            "PrincipioId",
            sql.Int,
            body.principioId
          )

          .query(`
            SELECT TOP 1
                PermissionId

            FROM dbo.usuariosPrincipiosPermisos

            WHERE
                UserId = @UserId

                AND SubModuleId =
                    @SubModuleId

                AND PrincipioId =
                    @PrincipioId

                AND ISNULL(CanEdit, 0) = 1;
          `);

      if (
        permisoPrincipio.recordset
          .length === 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "No tiene permiso de edición sobre este principio.",
          },
          {
            status: 403,
          }
        );
      }
    }

    /* ========================================================
       8. OBTENER / CREAR CABECERA
    ======================================================== */

    let evaluacionPrincipioId:
      | number
      | null = null;

    /* ========================================================
       ADMIN / SUBADMIN
    ======================================================== */

    if (esAdministrador) {
      const cabecera =
        await pool
          .request()

          .input(
            "SubModuleKey",
            sql.VarChar(100),
            body.subModuleKey
          )

          .input(
            "PrincipioId",
            sql.Int,
            body.principioId
          )

          .input(
            "PrincipioTitulo",
            sql.VarChar(100),
            body.principioTitulo || ""
          )

          .input(
            "Color",
            sql.VarChar(50),
            body.color || ""
          )

          .input(
            "RowColor",
            sql.VarChar(50),
            body.rowColor || ""
          )

          .input(
            "PreguntaGeneralNumero",
            sql.VarChar(30),
            body.preguntaGeneral?.numero ||
              ""
          )

          .input(
            "PreguntaGeneralTexto",
            sql.NVarChar(sql.MAX),
            body.preguntaGeneral?.texto ||
              ""
          )

          .execute(
            "sp_GuardarEvaluacionPrincipioCabeceraDGCI"
          );

      evaluacionPrincipioId =
        Number(
          cabecera.recordset?.[0]
            ?.EvaluacionPrincipioId
        );

      if (!evaluacionPrincipioId) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "No se pudo obtener el ID de evaluación.",
          },
          {
            status: 500,
          }
        );
      }
    }

    /* ========================================================
       USUARIO NORMAL

       NO puede crear cabecera.
    ======================================================== */

    else {
      const existente =
        await pool
          .request()

          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )

          .input(
            "PrincipioId",
            sql.Int,
            body.principioId
          )

          .query(`
            SELECT TOP 1
                Id AS EvaluacionPrincipioId

            FROM dbo.EvaluacionesPrincipioDGCI

            WHERE
                SubModuleId =
                    @SubModuleId

                AND PrincipioId =
                    @PrincipioId;
          `);

      evaluacionPrincipioId =
        Number(
          existente.recordset?.[0]
            ?.EvaluacionPrincipioId
        );

      if (!evaluacionPrincipioId) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "No existe evaluación para este principio. Debe crearla un administrador.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /* ========================================================
       9. ADMIN:
          OBTENER PREGUNTAS EXISTENTES

       Esto se utilizará para determinar cuáles
       fueron eliminadas desde la interfaz.
    ======================================================== */

    let preguntasExistentes: any[] = [];

    if (esAdministrador) {
      const existentesResult =
        await pool
          .request()

          .input(
            "EvaluacionPrincipioId",
            sql.Int,
            evaluacionPrincipioId
          )

          .query(`
            SELECT
                Id,
                Numero

            FROM dbo.EvaluacionesPrincipioDetalleDGCI

            WHERE
                EvaluacionPrincipioId =
                    @EvaluacionPrincipioId;
          `);

      preguntasExistentes =
        existentesResult.recordset || [];
    }

    /* ========================================================
       10. IDS QUE PERMANECEN

       Solo se usa para administrador.
    ======================================================== */

    const idsQuePermanecen =
      new Set<number>();

    /* ========================================================
       11. RECORRER PREGUNTAS
    ======================================================== */

    for (const p of body.preguntas) {
      /* ======================================================
         ADMINISTRADOR / SUBADMINISTRADOR
      ====================================================== */

      if (esAdministrador) {
        /*
         * Primero intentamos determinar si
         * esta pregunta ya existe.
         *
         * Preferencia:
         * 1. p.id
         * 2. buscar por Numero
         */

        let questionId =
          Number(p.id) || null;

        /* ----------------------------------------------------
           SI VIENE ID:
           confirmar que pertenece a esta evaluación
        ---------------------------------------------------- */

        if (questionId) {
          const existePorId =
            preguntasExistentes.find(
              (x: any) =>
                Number(x.Id) ===
                questionId
            );

          if (!existePorId) {
            questionId = null;
          }
        }

        /* ----------------------------------------------------
           FALLBACK:
           BUSCAR POR NUMERO

           Esto permite que el frontend siga funcionando
           aunque todavía no enviara p.id.
        ---------------------------------------------------- */

        if (!questionId) {
          const encontrada =
            preguntasExistentes.find(
              (x: any) =>
                String(
                  x.Numero ?? ""
                ).trim() ===
                String(
                  p.numero ?? ""
                ).trim()
            );

          if (encontrada) {
            questionId =
              Number(encontrada.Id);
          }
        }

        /* ====================================================
           PREGUNTA EXISTENTE

           Hacemos UPDATE DIRECTO POR ID.
           Esto conserva completamente el QuestionId.
        ==================================================== */

        if (questionId) {
          await pool
            .request()

            .input(
              "QuestionId",
              sql.Int,
              questionId
            )

            .input(
              "EvaluacionPrincipioId",
              sql.Int,
              evaluacionPrincipioId
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
              actorUserId
            )

            .query(`
              UPDATE dbo.EvaluacionesPrincipioDetalleDGCI

              SET
                  Numero = @Numero,
                  Texto = @Texto,
                  Cargo = @Cargo,
                  Existe = @Existe,
                  Aprobado = @Aprobado,
                  Difundido = @Difundido,
                  EstaPresente = @EstaPresente,
                  Implementado = @Implementado,
                  Actualizado = @Actualizado,
                  EstaFuncionando = @EstaFuncionando,
                  Calificacion = @Calificacion,
                  Nivel = @Nivel,
                  TipoDocumento = @TipoDocumento,
                  Descripcion = @Descripcion,
                  FechaEmision = @FechaEmision,
                  Interna = @Interna,
                  Externa = @Externa,
                  FechaActualizacion = GETDATE(),
                  ActorUserId = @ActorUserId

              WHERE
                  Id = @QuestionId

                  AND EvaluacionPrincipioId =
                      @EvaluacionPrincipioId;
            `);

          idsQuePermanecen.add(
            questionId
          );
        }

        /* ====================================================
           PREGUNTA NUEVA

           Utilizamos el procedimiento modificado.
        ==================================================== */

        else {
          const insertResult =
            await pool
              .request()

              .input(
                "EvaluacionPrincipioId",
                sql.Int,
                evaluacionPrincipioId
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
                actorUserId
              )

              .execute(
                "sp_InsertarEvaluacionPrincipioDetalleDGCI"
              );

          const nuevoId =
            Number(
              insertResult.recordset?.[0]
                ?.DetalleId
            );

          if (nuevoId) {
            idsQuePermanecen.add(
              nuevoId
            );
          }
        }
      }

      /* ======================================================
         USUARIO NORMAL
      ====================================================== */

      else {
        /*
         * Debemos obtener el QuestionId.
         *
         * Preferimos el ID que viene del GET.
         */

        let questionId =
          Number(p.id) || null;

        /* ----------------------------------------------------
           FALLBACK:
           si todavía el frontend no manda id,
           buscar la pregunta por su número.

           Después igualmente validamos el QuestionId
           contra la tabla de permisos.
        ---------------------------------------------------- */

        if (!questionId) {
          const buscarPregunta =
            await pool
              .request()

              .input(
                "EvaluacionPrincipioId",
                sql.Int,
                evaluacionPrincipioId
              )

              .input(
                "Numero",
                sql.VarChar(30),
                p.numero
              )

              .query(`
                SELECT TOP 1
                    Id

                FROM dbo.EvaluacionesPrincipioDetalleDGCI

                WHERE
                    EvaluacionPrincipioId =
                        @EvaluacionPrincipioId

                    AND Numero =
                        @Numero;
              `);

          questionId =
            Number(
              buscarPregunta
                .recordset?.[0]?.Id
            );
        }

        if (!questionId) {
          return NextResponse.json(
            {
              ok: false,
              message:
                `No se pudo identificar la pregunta ${p.numero ?? ""}.`,
            },
            {
              status: 400,
            }
          );
        }

        /* ====================================================
           VALIDAR QUE LA PREGUNTA PERTENECE
           REALMENTE A ESTE PRINCIPIO
        ==================================================== */

        const preguntaValida =
          await pool
            .request()

            .input(
              "QuestionId",
              sql.Int,
              questionId
            )

            .input(
              "EvaluacionPrincipioId",
              sql.Int,
              evaluacionPrincipioId
            )

            .query(`
              SELECT TOP 1
                  Id

              FROM dbo.EvaluacionesPrincipioDetalleDGCI

              WHERE
                  Id = @QuestionId

                  AND EvaluacionPrincipioId =
                      @EvaluacionPrincipioId;
            `);

        if (
          preguntaValida.recordset
            .length === 0
        ) {
          return NextResponse.json(
            {
              ok: false,
              message:
                "La pregunta no pertenece al principio indicado.",
            },
            {
              status: 403,
            }
          );
        }

        /* ====================================================
           VALIDAR CANEDIT SOBRE ESA PREGUNTA
        ==================================================== */

        const permisoPregunta =
          await pool
            .request()

            .input(
              "UserId",
              sql.UniqueIdentifier,
              actorUserId
            )

            .input(
              "SubModuleId",
              sql.Int,
              subModuleId
            )

            .input(
              "QuestionId",
              sql.Int,
              questionId
            )

            .query(`
              SELECT TOP 1
                  PermissionId

              FROM dbo.usuariosPrincipiosPreguntasPermisos

              WHERE
                  UserId = @UserId

                  AND SubModuleId =
                      @SubModuleId

                  AND QuestionId =
                      @QuestionId

                  AND ISNULL(CanEdit, 0) = 1;
            `);

        if (
          permisoPregunta.recordset
            .length === 0
        ) {
          return NextResponse.json(
            {
              ok: false,
              message:
                `No tiene permiso para modificar la pregunta ${p.numero ?? ""}.`,
            },
            {
              status: 403,
            }
          );
        }

        /* ====================================================
           UPDATE SEGURO

           Ahora actualizamos por QuestionId.
        ==================================================== */

        await pool
          .request()

          .input(
            "QuestionId",
            sql.Int,
            questionId
          )

          .input(
            "EvaluacionPrincipioId",
            sql.Int,
            evaluacionPrincipioId
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
            actorUserId
          )

          .query(`
            UPDATE dbo.EvaluacionesPrincipioDetalleDGCI

            SET
                Cargo = @Cargo,
                Existe = @Existe,
                Aprobado = @Aprobado,
                Difundido = @Difundido,
                EstaPresente = @EstaPresente,
                Implementado = @Implementado,
                Actualizado = @Actualizado,
                EstaFuncionando = @EstaFuncionando,
                Calificacion = @Calificacion,
                Nivel = @Nivel,
                TipoDocumento = @TipoDocumento,
                Descripcion = @Descripcion,
                FechaEmision = @FechaEmision,
                Interna = @Interna,
                Externa = @Externa,
                FechaActualizacion = GETDATE(),
                ActorUserId = @ActorUserId

            WHERE
                Id = @QuestionId

                AND EvaluacionPrincipioId =
                    @EvaluacionPrincipioId;
          `);
      }
    }

    /* ========================================================
       12. ADMIN:
           ELIMINAR PREGUNTAS QUE YA NO EXISTEN

       IMPORTANTE:
       primero eliminamos sus permisos.
    ======================================================== */

    if (esAdministrador) {
      const idsEliminar =
        preguntasExistentes
          .map((p: any) =>
            Number(p.Id)
          )
          .filter(
            (id: number) =>
              !idsQuePermanecen.has(id)
          );

      for (const questionId of idsEliminar) {
        /* ----------------------------------------------------
           ELIMINAR PERMISOS DE LA PREGUNTA
        ---------------------------------------------------- */

        await pool
          .request()

          .input(
            "QuestionId",
            sql.Int,
            questionId
          )

          .query(`
            DELETE
            FROM dbo.usuariosPrincipiosPreguntasPermisos

            WHERE
                QuestionId =
                    @QuestionId;
          `);

        /* ----------------------------------------------------
           ELIMINAR PREGUNTA
        ---------------------------------------------------- */

        await pool
          .request()

          .input(
            "QuestionId",
            sql.Int,
            questionId
          )

          .input(
            "EvaluacionPrincipioId",
            sql.Int,
            evaluacionPrincipioId
          )

          .query(`
            DELETE
            FROM dbo.EvaluacionesPrincipioDetalleDGCI

            WHERE
                Id = @QuestionId

                AND EvaluacionPrincipioId =
                    @EvaluacionPrincipioId;
          `);
      }
    }

    /* ========================================================
       13. RESPUESTA
    ======================================================== */

    return NextResponse.json({
      ok: true,
      evaluacionPrincipioId,
    });
  } catch (error: any) {
    console.error(
      "Error guardando evaluación:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Ocurrió un error al guardar la evaluación.",
      },
      {
        status: 500,
      }
    );
  }
}