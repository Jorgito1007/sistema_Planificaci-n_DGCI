import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    // ============================================================
    // 1. VALIDAR USUARIO
    // ============================================================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No auth" },
        { status: 401 }
      );
    }

    const roleKey = String(
      currentUser.roleKey ||
        currentUser.role ||
        ""
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "");

    console.log(
      "ADMIN MODULES ROLE:",
      roleKey
    );

    if (
      roleKey !== "administrador" &&
      roleKey !== "subadministrador"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado",
          roleKey,
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 2. CONEXIÓN
    // ============================================================

    const pool = await getPool();

    // ============================================================
    // 3. MÓDULOS
    // ============================================================

    const modulesRes =
      await pool.request().query(`
        SELECT
          ModuleId,
          ModuleKey,
          ModuleName
        FROM dbo.Modulos_Dgci
        WHERE ISNULL(IsActive, 0) = 1
        ORDER BY ModuleId ASC
      `);

    // ============================================================
    // 4. SUBMÓDULOS
    // ============================================================

    const subRes =
      await pool.request().query(`
        SELECT
          SubModuleId,
          ModuleId,
          SubModuleKey,
          SubModuleName,
          SortOrder
        FROM dbo.submodulos_dgci
        WHERE ISNULL(IsActive, 0) = 1
        ORDER BY
          ModuleId ASC,
          SortOrder ASC
      `);

    // ============================================================
    // 5. PREGUNTAS DEL SISTEMA ADMINISTRATIVO
    // ============================================================

    const questionsSARes =
      await pool.request().query(`
        SELECT
          msa.SubModuleId,
          msad.Id AS QuestionId,
          msad.MatrizSistemaAdministrativoId,
          msad.Numero,
          msad.Texto
        FROM dbo.Matriz_SistemaAdministrativoDetalle msad
        INNER JOIN dbo.Matriz_SistemaAdministrativo msa
          ON msa.Id = msad.MatrizSistemaAdministrativoId
        ORDER BY
          msa.SubModuleId ASC,
          msad.MatrizSistemaAdministrativoId ASC,
          msad.Numero ASC
      `);

    // ============================================================
    // 6. AGRUPAR PREGUNTAS DEL SISTEMA ADMINISTRATIVO
    // ============================================================

    const questionsSABySubmodule =
      new Map<string, any[]>();

    for (
      const q of
        questionsSARes.recordset
    ) {
      const subId =
        String(q.SubModuleId);

      if (
        !questionsSABySubmodule.has(
          subId
        )
      ) {
        questionsSABySubmodule.set(
          subId,
          []
        );
      }

      questionsSABySubmodule
        .get(subId)!
        .push({
          id: String(
            q.QuestionId
          ),

          parentId: String(
            q.MatrizSistemaAdministrativoId
          ),

          number: String(
            q.Numero ?? ""
          ),

          text:
            q.Texto ?? "",
        });
    }

    // ============================================================
    // 7. PRINCIPIOS DEL MÓDULO POR COMPONENTES
    // ============================================================

    const principlesRes =
      await pool.request().query(`
        SELECT
          Id,
          SubModuleId,
          PrincipioId,
          PrincipioTitulo,
          PreguntaGeneralNumero,
          PreguntaGeneralTexto
        FROM dbo.EvaluacionesPrincipioDGCI
        ORDER BY
          SubModuleId ASC,
          PrincipioId ASC
      `);

    // ============================================================
    // 8. AGRUPAR PRINCIPIOS POR SUBMÓDULO
    // ============================================================

    const principlesBySubmodule =
      new Map<string, any[]>();

    for (
      const p of
        principlesRes.recordset
    ) {
      const subId =
        String(p.SubModuleId);

      if (
        !principlesBySubmodule.has(
          subId
        )
      ) {
        principlesBySubmodule.set(
          subId,
          []
        );
      }

      principlesBySubmodule
        .get(subId)!
        .push({
          // IMPORTANTE:
          // Este ID sigue siendo PrincipioId porque
          // usuariosPrincipiosPermisos trabaja con PrincipioId.
          id: String(
            p.PrincipioId
          ),

          // Lo conservamos por si después
          // necesitamos la cabecera.
          evaluationId: String(
            p.Id
          ),

          title:
            p.PrincipioTitulo ??
            "",

          number: String(
            p.PreguntaGeneralNumero ??
              ""
          ),

          text:
            p.PreguntaGeneralTexto ??
            "",
        });
    }

    // ============================================================
    // 9. PREGUNTAS DE MATRIZ POR COMPONENTES
    //
    // EvaluacionesPrincipioDetalleDGCI
    //              ↓
    // EvaluacionPrincipioId
    //              ↓
    // EvaluacionesPrincipioDGCI.Id
    //              ↓
    // obtenemos PrincipioId + SubModuleId
    // ============================================================

    const questionsComponentsRes =
      await pool.request().query(`
        SELECT
          ep.SubModuleId,
          ep.PrincipioId,
          ep.Id AS EvaluacionPrincipioId,

          d.Id AS QuestionId,
          d.Numero,
          d.Texto

        FROM dbo.EvaluacionesPrincipioDetalleDGCI d

        INNER JOIN dbo.EvaluacionesPrincipioDGCI ep
          ON ep.Id = d.EvaluacionPrincipioId

        ORDER BY
          ep.SubModuleId ASC,
          ep.PrincipioId ASC,
          d.Numero ASC
      `);

    // ============================================================
    // 10. AGRUPAR PREGUNTAS POR COMPONENTES POR SUBMÓDULO
    // ============================================================

    const questionsComponentsBySubmodule =
      new Map<string, any[]>();

    for (
      const q of
        questionsComponentsRes.recordset
    ) {
      const subId =
        String(q.SubModuleId);

      if (
        !questionsComponentsBySubmodule.has(
          subId
        )
      ) {
        questionsComponentsBySubmodule.set(
          subId,
          []
        );
      }

      questionsComponentsBySubmodule
        .get(subId)!
        .push({
          // Este es el ID REAL de la pregunta.
          // Luego será QuestionId en
          // usuariosPrincipiosPreguntasPermisos.
          id: String(
            q.QuestionId
          ),

          // MUY IMPORTANTE:
          // parentId debe coincidir con p.id
          // del frontend.
          //
          // p.id = PrincipioId
          // q.parentId = PrincipioId
          parentId: String(
            q.PrincipioId
          ),

          number: String(
            q.Numero ?? ""
          ),

          text:
            q.Texto ?? "",

          evaluationId: String(
            q.EvaluacionPrincipioId
          ),
        });
    }

    // ============================================================
    // 11. AGRUPAR SUBMÓDULOS POR MÓDULO
    // ============================================================

    const subByModule =
      new Map<string, any[]>();

    for (
      const s of
        subRes.recordset
    ) {
      const moduleId =
        String(s.ModuleId);

      const subId =
        String(s.SubModuleId);

      if (
        !subByModule.has(
          moduleId
        )
      ) {
        subByModule.set(
          moduleId,
          []
        );
      }

      const principles =
        principlesBySubmodule.get(
          subId
        ) ?? [];

      // ========================================================
      // DETERMINAR QUÉ TIPO DE PREGUNTAS CORRESPONDE
      // ========================================================
      //
      // Si el submódulo tiene principios:
      //   → Por Componentes
      //
      // Si no tiene principios:
      //   → Sistema Administrativo
      // ========================================================

      const questions =
        principles.length > 0
          ? questionsComponentsBySubmodule.get(
              subId
            ) ?? []
          : questionsSABySubmodule.get(
              subId
            ) ?? [];

      subByModule
        .get(moduleId)!
        .push({
          id: subId,

          key:
            s.SubModuleKey,

          name:
            s.SubModuleName,

          principles,

          questions,
        });
    }

    // ============================================================
    // 12. CONSTRUIR RESPUESTA FINAL
    // ============================================================

    const modules =
      modulesRes.recordset.map(
        (m: any) => ({
          id: String(
            m.ModuleId
          ),

          key:
            m.ModuleKey,

          name:
            m.ModuleName,

          submodules:
            subByModule.get(
              String(
                m.ModuleId
              )
            ) || [],
        })
      );

    // ============================================================
    // 13. LOGS DE DEPURACIÓN
    // ============================================================

    console.log(
      "PRINCIPIOS POR COMPONENTES:",
      Array.from(
        principlesBySubmodule.entries()
      )
    );

    console.log(
      "PREGUNTAS POR COMPONENTES:",
      Array.from(
        questionsComponentsBySubmodule.entries()
      )
    );

    console.log(
      "PREGUNTAS SISTEMA ADMINISTRATIVO:",
      Array.from(
        questionsSABySubmodule.entries()
      )
    );

    // ============================================================
    // 14. RESPUESTA
    // ============================================================

    return NextResponse.json({
      modules,
    });

  } catch (error: any) {
    console.error(
      "ADMIN MODULES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error cargando módulos",
      },
      {
        status: 500,
      }
    );
  }
}