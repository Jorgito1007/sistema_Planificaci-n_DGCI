import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { field, value } = body;

    const allowedFields = [
      "Elaborado",
      "Aprobado",
      "Implementado",
      "Actualizado",
      "Difundido",
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: `Campo no permitido: ${field}` },
        { status: 400 }
      );
    }

    const me = await getCurrentUserFromToken();

    if (!me?.userId) {
      return NextResponse.json(
        { error: "No se pudo identificar el usuario autenticado" },
        { status: 401 }
      );
    }

    const pool = await getPool();

    const docResult = await pool
      .request()
      .input("DocumentId", Number(id))
      .query(`
        SELECT 
          DocumentId,
          Nombre,
          Elaborado,
          Aprobado,
          Implementado,
          Actualizado,
          Difundido
        FROM Documentos_DGCI
        WHERE DocumentId = @DocumentId
      `);

    const documento = docResult.recordset[0];

    if (!documento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    if (field === "Aprobado" && value === true && !documento.Elaborado) {
      return NextResponse.json(
        { error: "No puede aprobar un documento no elaborado" },
        { status: 400 }
      );
    }

    if (
      field === "Implementado" &&
      value === true &&
      (!documento.Elaborado || !documento.Aprobado)
    ) {
      return NextResponse.json(
        { error: "No puede implementar un documento sin elaborar y aprobar" },
        { status: 400 }
      );
    }

    if (
      field === "Actualizado" &&
      value === true &&
      (!documento.Elaborado || !documento.Aprobado || !documento.Implementado)
    ) {
      return NextResponse.json(
        { error: "No puede actualizar un documento sin los estados previos" },
        { status: 400 }
      );
    }

    if (
      field === "Difundido" &&
      value === true &&
      (
        !documento.Elaborado ||
        !documento.Aprobado ||
        !documento.Implementado ||
        !documento.Actualizado
      )
    ) {
      return NextResponse.json(
        { error: "No puede difundir un documento sin los estados previos" },
        { status: 400 }
      );
    }

    await pool
      .request()
      .input("DocumentId", Number(id))
      .input("Value", value)
      .query(`
        UPDATE Documentos_DGCI
        SET ${field} = @Value
        WHERE DocumentId = @DocumentId
      `);

    await pool
      .request()
      .input("ActorUserId", me.userId)
      .input(
        "Action",
        value
          ? `UPDATE_${String(field).toUpperCase()}`
          : `REMOVE_${String(field).toUpperCase()}`
      )
      .input("Entity", "Documentos_DGCI")
      .input("EntityId", String(id))
      .input(
        "Details",
        JSON.stringify({
          documento: documento.Nombre,
          campo: field,
          nuevoValor: value,
          usuarioEmail: me.email ?? null,
        })
      )
      .query(`
        INSERT INTO Auditoria_Datos_Dgci (
          ActorUserId,
          Action,
          Entity,
          EntityId,
          Details,
          CreatedAt
        )
        VALUES (
          @ActorUserId,
          @Action,
          @Entity,
          @EntityId,
          @Details,
          GETDATE()
        )
      `);

    return NextResponse.json({
      ok: true,
      message: "Estado actualizado correctamente",
    });
  } catch (error: any) {
    console.error("PATCH /api/documents/[id] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error al actualizar documento",
        sqlMessage: error?.originalError?.info?.message || null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const me = await getCurrentUserFromToken();

    if (!me?.userId) {
      return NextResponse.json(
        { error: "No se pudo identificar el usuario autenticado" },
        { status: 401 }
      );
    }

    const pool = await getPool();

    const docResult = await pool
      .request()
      .input("DocumentId", Number(id))
      .query(`
        SELECT 
          DocumentId,
          Nombre,
          SubModuleId,
          PdfUrl
        FROM Documentos_DGCI
        WHERE DocumentId = @DocumentId
      `);

    const documento = docResult.recordset[0];

    if (!documento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    await pool
      .request()
      .input("DocumentId", Number(id))
      .query(`
        DELETE FROM Documentos_DGCI
        WHERE DocumentId = @DocumentId
      `);

    try {
      await pool
        .request()
        .input("ActorUserId", me.userId)
        .input("Action", "DELETE_DOCUMENT")
        .input("Entity", "Documentos_DGCI")
        .input("EntityId", String(id))
        .input(
          "Details",
          JSON.stringify({
            documento: documento.Nombre,
            subModuleId: documento.SubModuleId,
            pdfUrl: documento.PdfUrl,
            usuarioEmail: me.email ?? null,
          })
        )
        .query(`
          INSERT INTO Auditoria_Datos_Dgci (
            ActorUserId,
            Action,
            Entity,
            EntityId,
            Details,
            CreatedAt
          )
          VALUES (
            @ActorUserId,
            @Action,
            @Entity,
            @EntityId,
            @Details,
            GETDATE()
          )
        `);
    } catch (auditError) {
      console.error("Error al registrar auditoría:", auditError);
    }

    return NextResponse.json({
      ok: true,
      message: `El documento "${documento.Nombre}" ha sido eliminado correctamente`,
    });
  } catch (error: any) {
    console.error("DELETE /api/documents/[id] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error al eliminar documento",
        sqlMessage: error?.originalError?.info?.message || null,
      },
      { status: 500 }
    );
  }
}