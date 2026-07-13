import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      WITH Sistemas AS (
        SELECT 
          1 AS Orden, 
          2 AS Sistema, 
          'ADMINISTRACIÓN DE LOS RECURSOS HUMANOS' AS Nombre

        UNION ALL SELECT 
          2, 3, 'PLANEACIÓN Y PROGRAMACIÓN'

        UNION ALL SELECT 
          3, 4, 'PRESUPUESTO'

        UNION ALL SELECT 
          4, 5, 'ADMINISTRACIÓN FINANCIERA'

        UNION ALL SELECT 
          5, 6, 'CONTABILIDAD INTEGRADA'

        UNION ALL SELECT 
          6, 7, 'CONTRATACIÓN Y ADMINISTRACIÓN DE BIENES Y SERVICIOS'

        UNION ALL SELECT 
          7, 8, 'INVERSIONES EN PROGRAMAS Y PROYECTOS'

        UNION ALL SELECT 
          8, 9, 'TECNOLOGÍA DE LA INFORMACIÓN (TI)'
      ),

      Detalle AS (
        SELECT
          Numero,

          TRY_CAST(
            LEFT(
              Numero,
              CHARINDEX('.', Numero + '.') - 1
            ) AS INT
          ) AS Sistema,

          TRY_CAST(Calificacion AS INT) AS Calificacion

        FROM dbo.Matriz_SistemaAdministrativoDetalle
      )

      SELECT
        s.Orden,
        s.Sistema,
        s.Nombre,

        COUNT(
          DISTINCT CASE
            WHEN d.Calificacion = 5
            THEN d.Numero
            ELSE NULL
          END
        ) AS Respondidas

      FROM Sistemas s

      LEFT JOIN Detalle d
        ON d.Sistema = s.Sistema

      GROUP BY
        s.Orden,
        s.Sistema,
        s.Nombre

      ORDER BY s.Orden;
    `);

    return NextResponse.json(result.recordset);
  } catch (error: any) {
    console.error(
      "Error obteniendo preguntas respondidas:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Error al obtener las preguntas respondidas",
      },
      { status: 500 }
    );
  }
}