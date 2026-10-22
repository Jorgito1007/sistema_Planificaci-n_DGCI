import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";
import { getCurrentUser } from "@/lib/current-user";
import { puedeVerSubmodulo } from "@/lib/permisos-api";

// ============================================================
// GET
// OBTENER EL ÚLTIMO RESULTADO GUARDADO
// ============================================================

export async function GET() {
  try {
    // Solo usuarios con sesión.
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        { ok: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    const pool = await getPool();

    const resultado = await pool.request().query(`
      SELECT TOP 1
        Id,
        Periodo_Inicio,
        Periodo_Fin,
        Calificacion_Global,
        Nivel_Global,
        Porcentaje_Global,

        Entorno_Control,
        Evaluacion_Riesgos,
        Actividades_Control,
        Informacion_Comunicacion,
        Supervision_Monitoreo,

        Conclusiones,
        Recomendaciones,

        ISNULL(Aprobado_General, 0) AS Aprobado_General,

        Fecha_Registro,
        Fecha_Aprobacion

      FROM dbo.Resultado_Componente

      ORDER BY Id DESC;
    `);

    if (resultado.recordset.length === 0) {
      return NextResponse.json({
        ok: true,
        existe: false,
        resultado: null,
      });
    }

    return NextResponse.json({
      ok: true,
      existe: true,
      resultado: resultado.recordset[0],
    });
  } catch (error) {
    console.error(
      "Error obteniendo Resultado_Componente:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo obtener el resultado de la evaluación.",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// POST
// GUARDAR O ACTUALIZAR RESULTADO
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // ==========================================================
    // AUTENTICACIÓN Y AUTORIZACIÓN
    // Sesión + permiso sobre el submódulo "sa_Reultados"
    // (administrador / subadministrador tienen acceso total).
    // ==========================================================
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        { ok: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (!(await puedeVerSubmodulo(me, "sa_Reultados"))) {
      return NextResponse.json(
        {
          ok: false,
          message: "No tiene permiso para modificar los resultados.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      periodoInicio,
      periodoFin,

      calificacionGlobal,
      nivelGlobal,
      porcentajeGlobal,

      entornoControl,
      evaluacionRiesgos,
      actividadesControl,
      informacionComunicacion,
      supervisionMonitoreo,

      conclusiones,
      recomendaciones,
    } = body;

    // ==========================================================
    // VALIDACIONES
    // ==========================================================

    if (!periodoInicio || !periodoFin) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe seleccionar el período de evaluación.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Date(periodoInicio) >
      new Date(periodoFin)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "La fecha inicial no puede ser mayor que la fecha final.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================================
    // CONEXIÓN
    // ==========================================================

    const pool = await getPool();

    // ==========================================================
    // BUSCAR ÚLTIMO RESULTADO
    // ==========================================================

    const estado = await pool.request().query(`
      SELECT TOP 1
        Id,
        ISNULL(Aprobado_General, 0) AS AprobadoGeneral

      FROM dbo.Resultado_Componente

      ORDER BY Id DESC;
    `);

    const resultadoActual =
      estado.recordset?.[0];

    // ==========================================================
    // SI YA ESTÁ APROBADO NO PERMITIR MODIFICACIONES
    // ==========================================================

    if (
      resultadoActual &&
      Number(
        resultadoActual.AprobadoGeneral
      ) === 1
    ) {
      return NextResponse.json(
        {
          ok: false,
          aprobado: true,
          message:
            "Los resultados ya fueron aprobados y no pueden modificarse.",
        },
        {
          status: 409,
        }
      );
    }

    // ==========================================================
    // ACTUALIZAR RESULTADO EXISTENTE
    // ==========================================================

    if (resultadoActual) {
      const resultado = await pool
        .request()

        .input(
          "Id",
          sql.Int,
          Number(resultadoActual.Id)
        )

        .input(
          "PeriodoInicio",
          sql.Date,
          periodoInicio
        )

        .input(
          "PeriodoFin",
          sql.Date,
          periodoFin
        )

        .input(
          "CalificacionGlobal",
          sql.Decimal(5, 2),
          Number(calificacionGlobal || 0)
        )

        .input(
          "NivelGlobal",
          sql.VarChar(20),
          String(nivelGlobal || "Bajo")
        )

        .input(
          "PorcentajeGlobal",
          sql.Decimal(5, 2),
          Number(porcentajeGlobal || 0)
        )

        .input(
          "EntornoControl",
          sql.Decimal(5, 2),
          Number(entornoControl || 0)
        )

        .input(
          "EvaluacionRiesgos",
          sql.Decimal(5, 2),
          Number(evaluacionRiesgos || 0)
        )

        .input(
          "ActividadesControl",
          sql.Decimal(5, 2),
          Number(actividadesControl || 0)
        )

        .input(
          "InformacionComunicacion",
          sql.Decimal(5, 2),
          Number(informacionComunicacion || 0)
        )

        .input(
          "SupervisionMonitoreo",
          sql.Decimal(5, 2),
          Number(supervisionMonitoreo || 0)
        )

        .input(
          "Conclusiones",
          sql.NVarChar(sql.MAX),
          conclusiones || null
        )

        .input(
          "Recomendaciones",
          sql.NVarChar(sql.MAX),
          recomendaciones || null
        )

        .query(`
          UPDATE dbo.Resultado_Componente

          SET
            Periodo_Inicio = @PeriodoInicio,
            Periodo_Fin = @PeriodoFin,

            Calificacion_Global = @CalificacionGlobal,
            Nivel_Global = @NivelGlobal,
            Porcentaje_Global = @PorcentajeGlobal,

            Entorno_Control = @EntornoControl,
            Evaluacion_Riesgos = @EvaluacionRiesgos,
            Actividades_Control = @ActividadesControl,
            Informacion_Comunicacion = @InformacionComunicacion,
            Supervision_Monitoreo = @SupervisionMonitoreo,

            Conclusiones = @Conclusiones,
            Recomendaciones = @Recomendaciones

          WHERE Id = @Id;


          SELECT *
          FROM dbo.Resultado_Componente
          WHERE Id = @Id;
        `);

      return NextResponse.json({
        ok: true,
        creado: false,
        message:
          "Los resultados fueron actualizados correctamente.",
        resultado:
          resultado.recordset?.[0] ?? null,
      });
    }

    // ==========================================================
    // INSERTAR NUEVO RESULTADO
    // ==========================================================

    const resultado = await pool
      .request()

      .input(
        "PeriodoInicio",
        sql.Date,
        periodoInicio
      )

      .input(
        "PeriodoFin",
        sql.Date,
        periodoFin
      )

      .input(
        "CalificacionGlobal",
        sql.Decimal(5, 2),
        Number(calificacionGlobal || 0)
      )

      .input(
        "NivelGlobal",
        sql.VarChar(20),
        String(nivelGlobal || "Bajo")
      )

      .input(
        "PorcentajeGlobal",
        sql.Decimal(5, 2),
        Number(porcentajeGlobal || 0)
      )

      .input(
        "EntornoControl",
        sql.Decimal(5, 2),
        Number(entornoControl || 0)
      )

      .input(
        "EvaluacionRiesgos",
        sql.Decimal(5, 2),
        Number(evaluacionRiesgos || 0)
      )

      .input(
        "ActividadesControl",
        sql.Decimal(5, 2),
        Number(actividadesControl || 0)
      )

      .input(
        "InformacionComunicacion",
        sql.Decimal(5, 2),
        Number(informacionComunicacion || 0)
      )

      .input(
        "SupervisionMonitoreo",
        sql.Decimal(5, 2),
        Number(supervisionMonitoreo || 0)
      )

      .input(
        "Conclusiones",
        sql.NVarChar(sql.MAX),
        conclusiones || null
      )

      .input(
        "Recomendaciones",
        sql.NVarChar(sql.MAX),
        recomendaciones || null
      )

      .query(`
        INSERT INTO dbo.Resultado_Componente
        (
          Periodo_Inicio,
          Periodo_Fin,

          Calificacion_Global,
          Nivel_Global,
          Porcentaje_Global,

          Entorno_Control,
          Evaluacion_Riesgos,
          Actividades_Control,
          Informacion_Comunicacion,
          Supervision_Monitoreo,

          Conclusiones,
          Recomendaciones,

          Aprobado_General
        )

        OUTPUT INSERTED.*

        VALUES
        (
          @PeriodoInicio,
          @PeriodoFin,

          @CalificacionGlobal,
          @NivelGlobal,
          @PorcentajeGlobal,

          @EntornoControl,
          @EvaluacionRiesgos,
          @ActividadesControl,
          @InformacionComunicacion,
          @SupervisionMonitoreo,

          @Conclusiones,
          @Recomendaciones,

          0
        );
      `);

    return NextResponse.json({
      ok: true,
      creado: true,
      message:
        "Los resultados fueron guardados correctamente.",
      resultado:
        resultado.recordset?.[0] ?? null,
    });
  } catch (error) {
    console.error(
      "Error guardando Resultado_Componente:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudieron guardar los resultados de la evaluación.",
      },
      {
        status: 500,
      }
    );
  }
}