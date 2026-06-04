import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUserFromToken } from "@/lib/current-user";
import { getCurrentUserId } from "@/lib/current-user";
import { auth } from "@/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { field, value, fecha } = body;

    const allowedFields = [
      "Elaborado",
      "Aprobado",
      "Implementado",
      "Actualizado",
      "Difundido",
    ] as const;

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
          Fecha_elaborado,
          Aprobado,
          Fecha_Aprobado,
          Implementado,
          Actualizado,
          Fecha_Actualizado,
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

    // Validaciones de flujo
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

    let updateSql = "";
    let action = "";
    let message = "Estado actualizado correctamente";

    // Reglas de negocio
    if (field === "Elaborado") {
      if (value === true) {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Elaborado = 1,
            Fecha_elaborado = ISNULL(Fecha_elaborado, GETDATE()),
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "UPDATE_ELABORADO";
        message = "Documento marcado como elaborado correctamente";
      } else {
        // Si se quita elaborado, se desactivan todos los demás
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Elaborado = 0,
            Fecha_elaborado = NULL,
            Aprobado = 0,
            Fecha_Aprobado = NULL,
            Implementado = 0,
            Actualizado = 0,
            Fecha_Actualizado = NULL,
            Difundido = 0,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "REMOVE_ELABORADO";
        message =
          "Se quitó Elaborado y se reiniciaron Aprobado, Implementado, Actualizado y Difundido";
      }
    }

    if (field === "Aprobado") {
      if (value === true) {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Aprobado = 1,
            Fecha_Aprobado = @Fecha,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "UPDATE_APROBADO";
        message = "Documento aprobado correctamente";
      } else {
        // Si se quita aprobado, también baja lo que depende de él
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Aprobado = 0,
            Fecha_Aprobado = NULL,
            Implementado = 0,
            Actualizado = 0,
            Fecha_Actualizado = NULL,
            Difundido = 0,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "REMOVE_APROBADO";
        message =
          "Se quitó Aprobado y se reiniciaron Implementado, Actualizado y Difundido";
      }
    }

    if (field === "Implementado") {
      if (value === true) {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Implementado = 1,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "UPDATE_IMPLEMENTADO";
        message = "Documento implementado correctamente";
      } else {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Implementado = 0,
            Actualizado = 0,
            Fecha_Actualizado = NULL,
            Difundido = 0,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "REMOVE_IMPLEMENTADO";
        message =
          "Se quitó Implementado y se reiniciaron Actualizado y Difundido";
      }
    }

    if (field === "Actualizado") {
      if (value === true) {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Actualizado = 1,
            Fecha_Actualizado = @Fecha,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "UPDATE_ACTUALIZADO";
        message = "Documento actualizado correctamente";
      } else {
        updateSql = `
          UPDATE Documentos_DGCI
          SET 
            Actualizado = 0,
            Fecha_Actualizado = NULL,
            Difundido = 0,
            UpdatedAt = GETDATE()
          WHERE DocumentId = @DocumentId
        `;
        action = "REMOVE_ACTUALIZADO";
        message = "Se quitó Actualizado y se reinició Difundido";
      }
    }

    if (field === "Difundido") {
      updateSql = `
        UPDATE Documentos_DGCI
        SET 
          Difundido = @Value,
          UpdatedAt = GETDATE()
        WHERE DocumentId = @DocumentId
      `;
      action = value ? "UPDATE_DIFUNDIDO" : "REMOVE_DIFUNDIDO";
      message = value
        ? "Documento difundido correctamente"
        : "Se quitó el estado Difundido";
    }

    await pool
      .request()
      .input("DocumentId", Number(id))
      .input("Value", value)
      .input("Fecha", fecha || null) 
      .query(updateSql);

    const estadoActualizado = await pool
      .request()
      .input("DocumentId", Number(id))
      .query(`
        SELECT
          DocumentId,
          Nombre,
          Elaborado,
          Fecha_elaborado,
          Aprobado,
          Fecha_Aprobado,
          Implementado,
          Actualizado,
          Fecha_Actualizado,
          Difundido,
          UpdatedAt
        FROM Documentos_DGCI
        WHERE DocumentId = @DocumentId
      `);

    const actualizado = estadoActualizado.recordset[0];

    await pool
      .request()
      .input("ActorUserId", me.userId)
      .input("Action", action)
      .input("Entity", "Documentos_DGCI")
      .input("EntityId", String(id))
      .input(
        "Details",
        JSON.stringify({
          documento: documento.Nombre,
          campo: field,
          nuevoValor: value,
          usuarioEmail: me.email ?? null,
          estadoFinal: actualizado,
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
      message,
      data: actualizado,
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
    const session = await auth();
    console.log("SESSION DELETE:", session);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No se pudo identificar el usuario autenticado" },
        { status: 401 }
      );
    }

    const actorUserId = await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        { error: "No se pudo obtener el UserId del usuario autenticado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
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

    await pool
      .request()
      .input("ActorUserId", actorUserId)
      .input("Action", "DELETE_DOCUMENT")
      .input("Entity", "Documentos_DGCI")
      .input("EntityId", String(id))
      .input(
        "Details",
        JSON.stringify({
          documento: documento.Nombre,
          subModuleId: documento.SubModuleId,
          pdfUrl: documento.PdfUrl,
          eliminadoPor: session.user.email,
          fechaEliminacion: new Date().toISOString(),
        })
      )
      .query(`
        INSERT INTO dbo.Auditoria_Datos_Dgci (
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