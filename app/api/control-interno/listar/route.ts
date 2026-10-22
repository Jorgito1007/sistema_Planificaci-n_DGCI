import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    // ============================================================
    // 1. VALIDAR USUARIO AUTENTICADO
    // ============================================================

    const currentUser = await getCurrentUser();

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

    // ============================================================
    // 2. OBTENER SUBMODULE KEY
    // ============================================================

    const { searchParams } = new URL(req.url);

    const subModuleKey =
      searchParams.get("subModuleKey");

    if (!subModuleKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "SubModuleKey requerido",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. IDENTIFICAR ROL
    // ============================================================

    const roleNormalizado = String(
      currentUser.roleKey ||
        currentUser.role ||
        ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const esExento =
      roleNormalizado === "administrador" ||
      roleNormalizado === "subadministrador";

    console.log(
      "CONTROL INTERNO LISTAR - USER:",
      currentUser.userId
    );

    console.log(
      "CONTROL INTERNO LISTAR - ROLE:",
      roleNormalizado
    );

    console.log(
      "CONTROL INTERNO LISTAR - SUBMODULE:",
      subModuleKey
    );

    console.log(
      "CONTROL INTERNO LISTAR - EXENTO:",
      esExento
    );

    // ============================================================
    // 4. CONEXIÓN
    // ============================================================

    const pool = await getPool();

    // ============================================================
    // 5. OBTENER SUBMODULE ID
    //
    // No confiamos solamente en QuestionId.
    // El permiso debe coincidir también con el submódulo.
    // ============================================================

    const subModuleResult = await pool
      .request()
      .input(
        "SubModuleKey",
        sql.VarChar(100),
        subModuleKey
      )
      .query(`
        SELECT TOP 1
          SubModuleId,
          ModuleId,
          SubModuleKey,
          SubModuleName
        FROM dbo.submodulos_dgci
        WHERE SubModuleKey = @SubModuleKey
          AND ISNULL(IsActive, 0) = 1;
      `);

    if (
      subModuleResult.recordset.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Submódulo no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const subModule =
      subModuleResult.recordset[0];

    const subModuleId = Number(
      subModule.SubModuleId
    );

    // ============================================================
    // 6. OBTENER PREGUNTAS PERMITIDAS
    //
    // ADMIN / SUBADMIN:
    //   no necesitan filtro.
    //
    // USUARIO NORMAL:
    //   solo QuestionId con CanView = 1.
    // ============================================================

    const preguntasPermitidas =
      new Set<number>();

    if (!esExento) {
      const userId =
        currentUser.userId;

      if (!userId) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "No se pudo identificar el usuario",
          },
          {
            status: 401,
          }
        );
      }

      const permisosResult =
        await pool
          .request()
          .input(
            "UserId",
            sql.UniqueIdentifier,
            userId
          )
          .input(
            "SubModuleId",
            sql.Int,
            subModuleId
          )
          .query(`
            SELECT
              QuestionId
            FROM dbo.usuariosPrincipiosPreguntasPermisos
            WHERE UserId = @UserId
              AND SubModuleId = @SubModuleId
              AND CanView = 1;
          `);

      for (
        const permiso of
          permisosResult.recordset
      ) {
        preguntasPermitidas.add(
          Number(
            permiso.QuestionId
          )
        );
      }

      console.log(
        "PREGUNTAS PERMITIDAS:",
        Array.from(
          preguntasPermitidas
        )
      );
    }

    // ============================================================
    // 7. OBTENER CABECERAS / PRINCIPIOS
    // ============================================================

    const cabecerasResult =
      await pool
        .request()
        .input(
          "SubModuleKey",
          sql.VarChar(100),
          subModuleKey
        )
        .execute(
          "sp_ObtenerEvaluacionesPorSubmoduloDGCI"
        );

    const cabeceras =
      cabecerasResult.recordset || [];

    const registros: any[] = [];

    // ============================================================
    // 8. RECORRER PRINCIPIOS
    // ============================================================

    for (const cabecera of cabeceras) {
      // ==========================================================
      // OBTENER DETALLE DEL PRINCIPIO
      // ==========================================================

      const detalleResult =
        await pool
          .request()
          .input(
            "EvaluacionPrincipioId",
            sql.Int,
            cabecera.Id
          )
          .execute(
            "sp_ObtenerDetalleEvaluacionDGCI"
          );

      const detalleCompleto =
        detalleResult.recordset || [];

      // ==========================================================
      // 9. FILTRAR PREGUNTAS
      //
      // ADMIN / SUBADMIN
      // → todas.
      //
      // NORMAL
      // → únicamente las asignadas.
      // ==========================================================

      const detalleFiltrado =
        esExento
          ? detalleCompleto
          : detalleCompleto.filter(
              (d: any) =>
                preguntasPermitidas.has(
                  Number(d.Id)
                )
            );

      // ==========================================================
      // 10. USUARIO NORMAL SIN PREGUNTAS EN ESTE PRINCIPIO
      //
      // No devolvemos el principio vacío.
      // ==========================================================

      if (
        !esExento &&
        detalleFiltrado.length === 0
      ) {
        continue;
      }

      // ==========================================================
      // 11. CONSTRUIR PRINCIPIO
      // ==========================================================

      registros.push({
        principioId:
          cabecera.PrincipioId,

        principioTitulo:
          cabecera.PrincipioTitulo,

        color:
          cabecera.Color,

        rowColor:
          cabecera.RowColor,

        preguntaGeneral: {
          numero:
            cabecera.PreguntaGeneralNumero,

          texto:
            cabecera.PreguntaGeneralTexto,
        },

        // ========================================================
        // PREGUNTAS
        // ========================================================

        preguntas:
          detalleFiltrado.map(
            (d: any) => ({
              // IMPORTANTE:
              // Este es el QuestionId utilizado
              // por la tabla de permisos.
              id:
                d.Id,

              numero:
                d.Numero ?? "",

              texto:
                d.Texto ?? "",

              cargo:
                d.Cargo ?? "",

              existe:
                d.Existe ?? 0,

              aprobado:
                d.Aprobado ?? 0,

              difundido:
                d.Difundido ?? 0,

              estaPresente:
                d.EstaPresente ??
                "NO",

              implementado:
                d.Implementado ??
                0,

              actualizado:
                d.Actualizado ??
                0,

              estaFuncionando:
                d.EstaFuncionando ??
                "NO",

              calificacion:
                d.Calificacion ??
                0,

              nivel:
                d.Nivel ?? "",

              tipoDocumento:
                d.TipoDocumento ??
                "",

              descripcion:
                d.Descripcion ??
                "",

              fechaEmision:
                d.FechaEmision
                  ? new Date(
                      d.FechaEmision
                    )
                      .toISOString()
                      .split(
                        "T"
                      )[0]
                  : "",

              interna:
                d.Interna ?? "",

              externa:
                d.Externa ?? "",
            })
          ),
      });
    }

    // ============================================================
    // 12. RESPUESTA
    // ============================================================

    return NextResponse.json({
      ok: true,

      data: registros,
    });

  } catch (error: any) {
    console.error(
      "Error listando control interno:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          "Error interno del servidor",
      },
      {
        status: 500,
      }
    );
  }
}