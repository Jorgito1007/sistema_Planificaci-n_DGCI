import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";
import { getCurrentUser } from "@/lib/current-user";
import { puedeAprobarResultados } from "@/lib/permisos-api";

export async function POST(request: NextRequest) {
  let transaction: sql.Transaction | null = null;

  try {
    // ============================================================
    // 0. AUTENTICACIÓN Y AUTORIZACIÓN
    //
    // Solo usuarios con rol CanApproveResults (igual que
    // la interfaz) pueden aprobar resultados consolidados.
    // ============================================================

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        { ok: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (!(await puedeAprobarResultados(me))) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tiene permiso para aprobar resultados.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 1. RECIBIR DATOS
    // ============================================================

    const body = await request.json();

    const resultadoId = Number(body?.resultadoId);

    // Si no viene tipo, asumimos COMPONENTES
    // para mantener compatibilidad con la matriz anterior.
    const tipo = String(
      body?.tipo || "COMPONENTES"
    ).toUpperCase();

    // ============================================================
    // 2. VALIDAR ID
    // ============================================================

    if (!resultadoId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se recibió el identificador del resultado que se desea aprobar.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 3. VALIDAR TIPO
    // ============================================================

    if (
      tipo !== "COMPONENTES" &&
      tipo !== "MATRIZ_SA"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El tipo de evaluación recibido no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const pool = await getPool();

    // ============================================================
    // 4. DETERMINAR TABLA DEL RESULTADO
    // ============================================================

    const tablaResultado =
      tipo === "MATRIZ_SA"
        ? "dbo.Resultado_MatrizSA"
        : "dbo.Resultado_Componente";
        console.log("====================================");
console.log("APROBACIÓN DE RESULTADOS");
console.log("resultadoId:", resultadoId);
console.log("tipo recibido:", tipo);
console.log("tabla consultada:", tablaResultado);
console.log("====================================");

    // ============================================================
    // 5. BUSCAR RESULTADO
    // ============================================================

   const resultado = await pool
  .request()
  .input(
    "ResultadoId",
    sql.Int,
    resultadoId
  )
  .query(`
    SELECT
      Id,
      ISNULL(Aprobado_General, 0) AS AprobadoGeneral
    FROM ${tablaResultado}
    WHERE Id = @ResultadoId;
  `);

console.log(
  "RESULTADO ENCONTRADO:",
  resultado.recordset
);
    // ============================================================
    // 6. VALIDAR EXISTENCIA
    // ============================================================

    if (resultado.recordset.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se encontró el resultado que se desea aprobar.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================================
    // 7. VERIFICAR SI YA ESTÁ APROBADO
    // ============================================================

    const yaAprobado =
      Number(
        resultado.recordset[0]?.AprobadoGeneral ?? 0
      ) === 1;

    if (yaAprobado) {
      return NextResponse.json({
        ok: true,
        aprobado: true,
        resultadoId,
        tipo,
        message:
          "Los resultados de la evaluación ya se encuentran aprobados.",
      });
    }

    // ============================================================
    // 8. INICIAR TRANSACCIÓN
    // ============================================================

    transaction =
      new sql.Transaction(pool);

    await transaction.begin();

    // ============================================================
    // 9. APROBAR RESULTADO CONSOLIDADO
    // ============================================================

    const requestResultado =
      new sql.Request(transaction);

    requestResultado.input(
      "ResultadoId",
      sql.Int,
      resultadoId
    );

    await requestResultado.query(`
      UPDATE ${tablaResultado}

      SET
        Aprobado_General = 1,
        Fecha_Aprobacion = SYSDATETIME()

      WHERE Id = @ResultadoId;
    `);

    // ============================================================
    // 10. APROBAR DETALLE
    //
    // NOTA: aquí existía un UPDATE sobre
    // EvaluacionesPrincipioDetalleDGCI y
    // Matriz_SistemaAdministrativoDetalle sin cláusula WHERE
    // (afectaba TODAS las filas de las tablas) y sobre una
    // columna "Aprobado_General" que no existe en esas tablas
    // (el flag real de aprobación vive en Resultado_*.
    // Aprobado_General, actualizado en el paso 9).
    //
    // Se eliminó por seguridad: el estado de aprobación
    // queda registrado únicamente en el resultado consolidado.
    // ============================================================

    // ============================================================
    // 11. CONFIRMAR TRANSACCIÓN
    // ============================================================

    await transaction.commit();

    transaction = null;

    // ============================================================
    // 12. RESPUESTA
    // ============================================================

    return NextResponse.json({
      ok: true,
      aprobado: true,
      resultadoId,
      tipo,

      message:
        tipo === "MATRIZ_SA"
          ? "Los resultados de los Sistemas de Administración fueron aprobados correctamente."
          : "Los resultados de Componentes fueron aprobados correctamente.",
    });

  } catch (error) {
    // ============================================================
    // ROLLBACK
    // ============================================================

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error(
          "Error realizando rollback:",
          rollbackError
        );
      }
    }

    console.error(
      "Error aprobando resultados:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudieron aprobar los resultados de la evaluación.",
      },
      {
        status: 500,
      }
    );
  }
}