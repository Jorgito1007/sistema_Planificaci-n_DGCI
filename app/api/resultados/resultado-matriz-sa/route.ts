import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";
import { getCurrentUser } from "@/lib/current-user";
import { puedeVerSubmodulo } from "@/lib/permisos-api";

// ============================================================
// GET
// OBTENER ÚLTIMO RESULTADO GUARDADO
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

        Recursos_Humanos,
        Planeacion_Programacion,
        Presupuesto,
        Administracion_Financiera,
        Contabilidad_Integrada,
        Contratacion_Bienes_Servicios,
        Inversiones_Programas_Proyectos,
        Tecnologia_Informacion,

        Conclusiones,
        Recomendaciones,

        ISNULL(Aprobado_General, 0) AS Aprobado_General,

        Fecha_Registro,
        Fecha_Aprobacion

      FROM dbo.Resultado_MatrizSA

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
      "Error obteniendo Resultado_MatrizSA:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo obtener el resultado de los Sistemas de Administración.",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// POST
// GUARDAR / ACTUALIZAR RESULTADO
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // ==========================================================
    // AUTENTICACIÓN Y AUTORIZACIÓN
    // Sesión + permiso sobre el submódulo "m_Reultados"
    // (administrador / subadministrador tienen acceso total).
    // ==========================================================
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json(
        { ok: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    if (!(await puedeVerSubmodulo(me, "m_Reultados"))) {
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

      recursosHumanos,
      planeacionProgramacion,
      presupuesto,
      administracionFinanciera,
      contabilidadIntegrada,
      contratacionBienesServicios,
      inversionesProgramasProyectos,
      tecnologiaInformacion,

      conclusiones,
      recomendaciones,
    } = body;

    // ==========================================================
    // VALIDAR PERÍODO
    // ==========================================================

    if (!periodoInicio || !periodoFin) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe seleccionar el período evaluado.",
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

    const pool = await getPool();

    // ==========================================================
    // BUSCAR ÚLTIMO RESULTADO
    // ==========================================================

    const estado = await pool.request().query(`
      SELECT TOP 1
        Id,
        ISNULL(Aprobado_General, 0) AS AprobadoGeneral

      FROM dbo.Resultado_MatrizSA

      ORDER BY Id DESC;
    `);

    const resultadoActual =
      estado.recordset?.[0];

    // ==========================================================
    // SI YA ESTÁ APROBADO, NO MODIFICAR
    // ==========================================================

    if (
      resultadoActual &&
      Number(resultadoActual.AprobadoGeneral) === 1
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
    // PREPARAR REQUEST
    // ==========================================================

    const prepararRequest = () =>
      pool
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
          "RecursosHumanos",
          sql.Decimal(5, 2),
          Number(recursosHumanos || 0)
        )

        .input(
          "PlaneacionProgramacion",
          sql.Decimal(5, 2),
          Number(planeacionProgramacion || 0)
        )

        .input(
          "Presupuesto",
          sql.Decimal(5, 2),
          Number(presupuesto || 0)
        )

        .input(
          "AdministracionFinanciera",
          sql.Decimal(5, 2),
          Number(administracionFinanciera || 0)
        )

        .input(
          "ContabilidadIntegrada",
          sql.Decimal(5, 2),
          Number(contabilidadIntegrada || 0)
        )

        .input(
          "ContratacionBienesServicios",
          sql.Decimal(5, 2),
          Number(contratacionBienesServicios || 0)
        )

        .input(
          "InversionesProgramasProyectos",
          sql.Decimal(5, 2),
          Number(inversionesProgramasProyectos || 0)
        )

        .input(
          "TecnologiaInformacion",
          sql.Decimal(5, 2),
          Number(tecnologiaInformacion || 0)
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
        );

    // ==========================================================
    // ACTUALIZAR SI EXISTE Y TODAVÍA NO ESTÁ APROBADO
    // ==========================================================

    if (resultadoActual) {
      const requestSQL =
        prepararRequest();

      requestSQL.input(
        "Id",
        sql.Int,
        Number(resultadoActual.Id)
      );

      const resultado =
        await requestSQL.query(`
          UPDATE dbo.Resultado_MatrizSA

          SET
            Periodo_Inicio = @PeriodoInicio,
            Periodo_Fin = @PeriodoFin,

            Calificacion_Global = @CalificacionGlobal,
            Nivel_Global = @NivelGlobal,
            Porcentaje_Global = @PorcentajeGlobal,

            Recursos_Humanos = @RecursosHumanos,
            Planeacion_Programacion = @PlaneacionProgramacion,
            Presupuesto = @Presupuesto,
            Administracion_Financiera = @AdministracionFinanciera,
            Contabilidad_Integrada = @ContabilidadIntegrada,
            Contratacion_Bienes_Servicios = @ContratacionBienesServicios,
            Inversiones_Programas_Proyectos = @InversionesProgramasProyectos,
            Tecnologia_Informacion = @TecnologiaInformacion,

            Conclusiones = @Conclusiones,
            Recomendaciones = @Recomendaciones

          WHERE Id = @Id;

          SELECT *
          FROM dbo.Resultado_MatrizSA
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

    const resultado =
      await prepararRequest().query(`
        INSERT INTO dbo.Resultado_MatrizSA
        (
          Periodo_Inicio,
          Periodo_Fin,

          Calificacion_Global,
          Nivel_Global,
          Porcentaje_Global,

          Recursos_Humanos,
          Planeacion_Programacion,
          Presupuesto,
          Administracion_Financiera,
          Contabilidad_Integrada,
          Contratacion_Bienes_Servicios,
          Inversiones_Programas_Proyectos,
          Tecnologia_Informacion,

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

          @RecursosHumanos,
          @PlaneacionProgramacion,
          @Presupuesto,
          @AdministracionFinanciera,
          @ContabilidadIntegrada,
          @ContratacionBienesServicios,
          @InversionesProgramasProyectos,
          @TecnologiaInformacion,

          @Conclusiones,
          @Recomendaciones,

          0
        );
      `);

    return NextResponse.json({
      ok: true,
      creado: true,
      message:
        "Los resultados de los Sistemas de Administración fueron guardados correctamente.",
      resultado:
        resultado.recordset?.[0] ?? null,
    });

  } catch (error) {
    console.error(
      "Error guardando Resultado_MatrizSA:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudieron guardar los resultados de los Sistemas de Administración.",
      },
      {
        status: 500,
      }
    );
  }
}