import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export async function PUT(req: NextRequest) {
  try {
    const actorUserId = await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const documentId = Number(formData.get("DocumentId"));
    const nombre = String(formData.get("Nombre") || "").trim();
    const file = formData.get("file") as File | null;

    if (!documentId || Number.isNaN(documentId)) {
      return NextResponse.json(
        { error: "DocumentId inválido" },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del documento es obligatorio" },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar el nuevo archivo" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Buscar documento actual
    const documentoActual = await pool
      .request()
      .input("DocumentId", sql.Int, documentId)
      .query(`
        SELECT TOP 1
          DocumentId,
          Nombre,
          PdfUrl
        FROM dbo.Documentos_DGCI
        WHERE DocumentId = @DocumentId
      `);

    if (documentoActual.recordset.length === 0) {
      return NextResponse.json(
        { error: "El documento no existe." },
        { status: 404 }
      );
    }

    const anterior = documentoActual.recordset[0];

    // Validar extensión
    const ext = path.extname(file.name).toLowerCase();

    const allowedExt = [
      ".pdf",
      ".doc",
      ".docx",
    ];

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedExt.includes(ext) &&
      !allowedTypes.includes(file.type)
    ) {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF, DOC o DOCX" },
        { status: 400 }
      );
    }

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "documents"
    );

    await mkdir(uploadDir, {
      recursive: true,
    });

    const baseName = path
      .basename(file.name, ext)
      .replace(/\s+/g, "_");

    const safeName =
      `${Date.now()}-${baseName}${ext}`;

    const filePath = path.join(
      uploadDir,
      safeName
    );

    await writeFile(filePath, buffer);

    const pdfUrl =
      `/api/documents/file/${safeName}`;

    // Actualizar MISMO DocumentId
    const result = await pool
      .request()
      .input("DocumentId", sql.Int, documentId)
      .input("Nombre", sql.NVarChar(255), nombre)
      .input("PdfUrl", sql.NVarChar(sql.MAX), pdfUrl)
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        UPDATE dbo.Documentos_DGCI
        SET
          Nombre = @Nombre,
          PdfUrl = @PdfUrl,
          UpdatedAt = GETDATE(),
          ActorUserId = @ActorUserId
        WHERE DocumentId = @DocumentId;

        SELECT
          DocumentId,
          Nombre,
          PdfUrl,
          UpdatedAt
        FROM dbo.Documentos_DGCI
        WHERE DocumentId = @DocumentId;
      `);

    const actualizado = result.recordset[0];

    // Auditoría
    await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .input(
        "Action",
        sql.NVarChar(200),
        "REPLACE_DOCUMENT"
      )
      .input(
        "Entity",
        sql.NVarChar(100),
        "Documentos_DGCI"
      )
      .input(
        "EntityId",
        sql.NVarChar(100),
        String(documentId)
      )
      .input(
        "Details",
        sql.NVarChar(sql.MAX),
        JSON.stringify({
          documentId,
          nombreAnterior: anterior.Nombre,
          archivoAnterior: anterior.PdfUrl,
          nombreNuevo: actualizado.Nombre,
          archivoNuevo: actualizado.PdfUrl,
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
      documento: actualizado,
    });

  } catch (error: any) {
    console.error(
      "Error reemplazando documento:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error.message ||
          "No se pudo reemplazar el documento",
      },
      { status: 500 }
    );
  }
}