import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import path from "path";
import {
  access,
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";
import { sendMail } from "@/lib/sendMail";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Convierte una URL como:
 * /api/documents/file/1784216240708-documento.pdf
 *
 * en la ruta física:
 * public/uploads/documents/1784216240708-documento.pdf
 */
function getPhysicalFilePath(pdfUrl: string | null) {
  if (!pdfUrl) {
    return null;
  }

  const fileName = pdfUrl.split("/").pop();

  if (!fileName) {
    return null;
  }

  /**
   * path.basename evita que se reciban rutas como:
   * ../../archivo
   */
  const safeFileName = path.basename(fileName);

  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "documents",
    safeFileName
  );
}

/**
 * Elimina el documento anterior.
 * Si no existe, no detiene el proceso.
 */
async function deletePreviousFile(pdfUrl: string | null) {
  try {
    const oldFilePath = getPhysicalFilePath(pdfUrl);

    if (!oldFilePath) {
      return;
    }

    await access(oldFilePath);
    await unlink(oldFilePath);

    console.log("Archivo anterior eliminado:", oldFilePath);
  } catch (error: any) {
    /**
     * ENOENT significa que el archivo no estaba físicamente.
     * No es necesario detener la actualización.
     */
    if (error?.code === "ENOENT") {
      console.log(
        "El archivo anterior no existe físicamente. Se continúa con la actualización."
      );
      return;
    }

    console.error(
      "No fue posible eliminar el archivo anterior:",
      error
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  let newFilePath: string | null = null;

  try {
    const actorUserId = await getCurrentUserId();

    if (!actorUserId) {
      return NextResponse.json(
        {
          error:
            "No se pudo obtener el UserId del usuario autenticado",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const documentId = Number(id);

    if (!documentId || Number.isNaN(documentId)) {
      return NextResponse.json(
        {
          error: "El identificador del documento es inválido",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const fechaActualizado = String(
      formData.get("fecha") ||
        formData.get("Fecha_Actualizado") ||
        ""
    ).trim();

    const file = formData.get("file") as File | null;

    if (!fechaActualizado) {
      return NextResponse.json(
        {
          error: "Debe seleccionar la fecha de actualización",
        },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        {
          error: "Debe seleccionar el nuevo documento",
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extension = path.extname(file.name).toLowerCase();

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      return NextResponse.json(
        {
          error:
            "Solo se permiten archivos PDF, DOC o DOCX",
        },
        { status: 400 }
      );
    }

    /**
     * Límite opcional de 20 MB.
     */
    const maxFileSize = 20 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error:
            "El archivo no puede superar los 20 MB",
        },
        { status: 400 }
      );
    }

    const pool = await getPool();

    /**
     * Buscar documento existente antes de guardar el nuevo.
     */
    const documentResult = await pool
      .request()
      .input(
        "DocumentId",
        sql.Int,
        documentId
      )
      .query(`
        SELECT TOP 1
          D.DocumentId,
          D.Nombre,
          D.SubModuleId,
          D.Elaborado,
          D.Aprobado,
          D.Implementado,
          D.Actualizado,
          D.Fecha_Actualizado,
          D.Difundido,
          D.PdfUrl,
          S.SubModuleName
        FROM dbo.Documentos_DGCI D
        LEFT JOIN dbo.submodulos_dgci S
          ON S.SubModuleId = D.SubModuleId
        WHERE D.DocumentId = @DocumentId
      `);

    const existingDocument =
      documentResult.recordset[0];

    if (!existingDocument) {
      return NextResponse.json(
        {
          error: "El documento no fue encontrado",
        },
        { status: 404 }
      );
    }

    /**
     * Mantiene la regla del flujo:
     * para actualizar debe estar elaborado,
     * aprobado e implementado.
     */
    if (
      !existingDocument.Elaborado ||
      !existingDocument.Aprobado ||
      !existingDocument.Implementado
    ) {
      return NextResponse.json(
        {
          error:
            "El documento debe estar elaborado, aprobado e implementado antes de actualizarlo",
        },
        { status: 400 }
      );
    }

    /**
     * Guardar primero el nuevo archivo.
     */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "documents"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const originalBaseName = path
      .basename(file.name, extension)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    const baseName =
      originalBaseName || "documento_actualizado";

    const safeName =
      `${Date.now()}-${baseName}${extension}`;

    newFilePath = path.join(
      uploadDirectory,
      safeName
    );

    await writeFile(newFilePath, buffer);

    const newPdfUrl =
      `/api/documents/file/${safeName}`;

    /**
     * Actualizar la misma fila:
     * - sustituye PdfUrl;
     * - establece Actualizado;
     * - coloca Fecha_Actualizado;
     * - actualiza UpdatedAt.
     */
    const updateResult = await pool
      .request()
      .input(
        "DocumentId",
        sql.Int,
        documentId
      )
      .input(
        "Fecha_Actualizado",
        sql.Date,
        fechaActualizado
      )
      .input(
        "PdfUrl",
        sql.NVarChar(sql.MAX),
        newPdfUrl
      )
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        UPDATE dbo.Documentos_DGCI
        SET
          Actualizado = 1,
          Fecha_Actualizado = @Fecha_Actualizado,
          PdfUrl = @PdfUrl,
          UpdatedAt = GETDATE(),
          ActorUserId = @ActorUserId
        OUTPUT
          INSERTED.DocumentId,
          INSERTED.Nombre,
          INSERTED.SubModuleId,
          INSERTED.Elaborado,
          INSERTED.Aprobado,
          INSERTED.Fecha_Aprobado,
          INSERTED.Implementado,
          INSERTED.Actualizado,
          INSERTED.Fecha_Actualizado,
          INSERTED.Difundido,
          INSERTED.PdfUrl,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt,
          INSERTED.ActorUserId
        WHERE DocumentId = @DocumentId
      `);

    const updatedDocument =
      updateResult.recordset[0];

    if (!updatedDocument) {
      /**
       * Si falló el UPDATE después de guardar el archivo,
       * se elimina el nuevo archivo para no dejarlo huérfano.
       */
      if (newFilePath) {
        await unlink(newFilePath).catch(() => null);
      }

      return NextResponse.json(
        {
          error:
            "No fue posible actualizar el documento",
        },
        { status: 500 }
      );
    }

    /**
     * El nuevo archivo ya está guardado y la BD actualizada.
     * Ahora se elimina el archivo anterior.
     */
    if (
      existingDocument.PdfUrl &&
      existingDocument.PdfUrl !== newPdfUrl
    ) {
      await deletePreviousFile(
        existingDocument.PdfUrl
      );
    }

    /**
     * Obtener datos del usuario para auditoría y correo.
     */
    const userResult = await pool
      .request()
      .input(
        "UserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .query(`
        SELECT TOP 1
          FullName,
          Email
        FROM dbo.Usuarios_Dgci
        WHERE UserId = @UserId
      `);

    const usuarioNombre =
      userResult.recordset[0]?.FullName ||
      "Usuario no identificado";

    const usuarioEmail =
      userResult.recordset[0]?.Email ||
      "Correo no identificado";

    /**
     * Auditoría.
     */
    await pool
      .request()
      .input(
        "ActorUserId",
        sql.UniqueIdentifier,
        actorUserId
      )
      .input(
        "Action",
        sql.VarChar(100),
        "UPDATE_DOCUMENT_FILE"
      )
      .input(
        "Entity",
        sql.VarChar(100),
        "Documentos_DGCI"
      )
      .input(
        "EntityId",
        sql.VarChar(100),
        String(documentId)
      )
      .input(
        "Details",
        sql.NVarChar(sql.MAX),
        JSON.stringify({
          documento: updatedDocument.Nombre,
          subModuleId:
            updatedDocument.SubModuleId,
          fechaActualizado:
            updatedDocument.Fecha_Actualizado,
          archivoAnterior:
            existingDocument.PdfUrl,
          archivoNuevo:
            updatedDocument.PdfUrl,
          actualizadoPor: usuarioNombre,
          correoUsuario: usuarioEmail,
          fechaOperacion:
            new Date().toISOString(),
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

    /**
     * Correo informativo.
     * Un error de correo no deshace la actualización.
     */
    const correosCopia: string[] =
      process.env.CORREOS_COPIA_DGCI
        ? process.env.CORREOS_COPIA_DGCI
            .split(",")
            .map((correo) => correo.trim())
            .filter(Boolean)
        : [];

    try {
      if (process.env.DIRECTOR_EMAIL) {
        await sendMail({
          to: process.env.DIRECTOR_EMAIL,
          cc: correosCopia,
          subject:
            `Documento actualizado - ${
              existingDocument.SubModuleName ||
              "Sistema de Control Interno"
            }`,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <div style="text-align:center;">
                <img
                  width="400"
                  height="97"
                  src="https://nuevoingreso.uncsm.edu.ni/img/logo-color.png"
                  alt="UNCSM"
                />
              </div>

              <p><strong>Estimado(a):</strong></p>

              <p>
                Se informa que el usuario
                <strong>${usuarioNombre}</strong>
                ha actualizado un documento en el
                Sistema de Control Interno DGCI.
              </p>

              <p>
                <strong>Documento:</strong>
                ${updatedDocument.Nombre}
              </p>

              <p>
                <strong>Submódulo:</strong>
                ${
                  existingDocument.SubModuleName ||
                  "Submódulo no identificado"
                }
              </p>

              <p>
                <strong>Fecha de actualización:</strong>
                ${fechaActualizado}
              </p>

              <p>
                <strong>Fecha de operación:</strong>
                ${new Date().toLocaleString("es-NI")}
              </p>

              <br />

              <p>No es necesario responder este correo.</p>

              <p>
                Universidad Nacional Casimiro Sotelo Montenegro
              </p>

              <p>
                <i>
                  ¡Revolucionando la Conciencia,
                  Llegamos a la Libertad!
                </i>
              </p>
            </div>
          `,
        });
      }
    } catch (mailError) {
      console.error(
        "Error enviando correo de actualización:",
        mailError
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Documento actualizado correctamente",
      ...updatedDocument,
    });
  } catch (error: any) {
    console.error(
      "PATCH /api/documents/[id]/actualizar error:",
      error
    );

    /**
     * Si se guardó el nuevo archivo pero ocurrió un error
     * antes de actualizar correctamente la base de datos,
     * se intenta eliminar.
     */
    if (newFilePath) {
      await unlink(newFilePath).catch(() => null);
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error al actualizar el documento",
        sqlMessage:
          error?.originalError?.info?.message ||
          null,
        code: error?.code || null,
        name: error?.name || null,
      },
      { status: 500 }
    );
  }
}