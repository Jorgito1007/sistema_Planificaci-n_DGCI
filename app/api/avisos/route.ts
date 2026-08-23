import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// =====================================================
// GET - Obtener avisos
// =====================================================
export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        a.Id,
        a.Titulo,
        a.Mensaje,
        a.Tipo,
      CONVERT(VARCHAR(19), a.FechaInicio, 120) AS FechaInicio,
CONVERT(VARCHAR(19), a.FechaFin, 120) AS FechaFin,
        a.Activo,
        a.ActorUserId,
        a.FechaCreacion,
        u.FullName AS UsuarioCreacion
      FROM dbo.AvisosSistema a
      LEFT JOIN dbo.Usuarios_Dgci u
        ON u.UserId = a.ActorUserId
      ORDER BY a.FechaCreacion DESC
    `);

    return NextResponse.json({
      ok: true,
      avisos: result.recordset,
    });

  } catch (error) {

    console.error("Error obteniendo avisos:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudieron obtener los avisos.",
      },
      { status: 500 }
    );
  }
}


// =====================================================
// POST - Crear aviso
// =====================================================
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    const {
      titulo,
      mensaje,
      tipo,
      fechaInicio,
      fechaFin,
      activo,
    } = body;

    // ---------------------------------------------
    // Validaciones
    // ---------------------------------------------

    if (!titulo?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "El título del aviso es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!mensaje?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "El mensaje del aviso es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        {
          ok: false,
          message: "Debe indicar la fecha de inicio y fecha de fin.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Usuario autenticado
    // ---------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no autenticado.",
        },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // ---------------------------------------------
    // Insertar aviso
    // ---------------------------------------------

    const result = await pool
      .request()

      .input(
        "Titulo",
        sql.NVarChar(200),
        titulo.trim()
      )

      .input(
        "Mensaje",
        sql.NVarChar(sql.MAX),
        mensaje.trim()
      )

      .input(
        "Tipo",
        sql.NVarChar(30),
        tipo || "informativo"
      )

.input(
  "FechaInicioTexto",
  sql.VarChar(19),
  fechaInicio.replace("T", " ") + ":00"
)

.input(
  "FechaFinTexto",
  sql.VarChar(19),
  fechaFin.replace("T", " ") + ":00"
)
      .input(
        "Activo",
        sql.Bit,
        activo !== false ? 1 : 0
      )

      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        currentUser.userId
      )

      .query(`
        INSERT INTO dbo.AvisosSistema
        (
          Titulo,
          Mensaje,
          Tipo,
          FechaInicio,
          FechaFin,
          Activo,
          ActorUserId
        )
        OUTPUT INSERTED.Id
        VALUES
        (
          @Titulo,
          @Mensaje,
          @Tipo,
         CONVERT(datetime2(0), @FechaInicioTexto, 120),
  CONVERT(datetime2(0), @FechaFinTexto, 120),
          @Activo,
          @ActorUserId
        )
      `);

    const id = result.recordset[0]?.Id;

    return NextResponse.json({
      ok: true,
      id,
      message: "Aviso creado correctamente.",
    });

  } catch (error: any) {

    console.error("Error creando aviso:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "No se pudo crear el aviso.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT - Editar aviso
// =====================================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      titulo,
      mensaje,
      tipo,
      fechaInicio,
      fechaFin,
      activo,
    } = body;

    // ---------------------------------------------
    // Validaciones
    // ---------------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se recibió el ID del aviso.",
        },
        { status: 400 }
      );
    }

    if (!titulo?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "El título del aviso es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!mensaje?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "El mensaje del aviso es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        {
          ok: false,
          message: "Debe indicar la fecha de inicio y fecha de fin.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Usuario autenticado
    // ---------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario no autenticado.",
        },
        { status: 401 }
      );
    }

    const pool = await getPool();

    // ---------------------------------------------
    // Verificar que existe
    // ---------------------------------------------

    const existe = await pool
      .request()
      .input("Id", sql.Int, Number(id))
      .query(`
        SELECT TOP 1 Id
        FROM dbo.AvisosSistema
        WHERE Id = @Id
      `);

    if (existe.recordset.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "El aviso no existe.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // Actualizar
    // ---------------------------------------------

    await pool
      .request()

      .input(
        "Id",
        sql.Int,
        Number(id)
      )

      .input(
        "Titulo",
        sql.NVarChar(200),
        titulo.trim()
      )

      .input(
        "Mensaje",
        sql.NVarChar(sql.MAX),
        mensaje.trim()
      )

      .input(
        "Tipo",
        sql.NVarChar(30),
        tipo || "informativo"
      )

      .input(
        "FechaInicioTexto",
        sql.VarChar(19),
        fechaInicio.replace("T", " ") + ":00"
      )

      .input(
        "FechaFinTexto",
        sql.VarChar(19),
        fechaFin.replace("T", " ") + ":00"
      )

      .input(
        "Activo",
        sql.Bit,
        activo ? 1 : 0
      )

      .query(`
        UPDATE dbo.AvisosSistema
        SET
          Titulo = @Titulo,
          Mensaje = @Mensaje,
          Tipo = @Tipo,

          FechaInicio = CONVERT(
            datetime2(0),
            @FechaInicioTexto,
            120
          ),

          FechaFin = CONVERT(
            datetime2(0),
            @FechaFinTexto,
            120
          ),

          Activo = @Activo,
FechaActualizacion = DATEADD(HOUR, -6, GETUTCDATE()),
        WHERE Id = @Id
      `);

    return NextResponse.json({
      ok: true,
      message: "Aviso actualizado correctamente.",
    });

  } catch (error: any) {

    console.error(
      "Error actualizando aviso:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "No se pudo actualizar el aviso.",
      },
      { status: 500 }
    );
  }
}