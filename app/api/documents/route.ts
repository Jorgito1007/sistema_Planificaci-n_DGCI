import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const Nombre = String(formData.get("Nombre") || "").trim();
    const SubModuleId = Number(formData.get("SubModuleId"));
    const Elaborado = String(formData.get("Elaborado")) === "true";
    const Aprobado = String(formData.get("Aprobado")) === "true";
    const Implementado = String(formData.get("Implementado")) === "true";
    const Actualizado = String(formData.get("Actualizado")) === "true";
    const Difundido = String(formData.get("Difundido")) === "true";
    const pdf = formData.get("pdf") as File | null;

    if (!Nombre) {
      return NextResponse.json(
        { error: "El nombre del documento es obligatorio" },
        { status: 400 }
      );
    }

    if (!SubModuleId || Number.isNaN(SubModuleId)) {
      return NextResponse.json(
        { error: "El SubModuleId es inválido" },
        { status: 400 }
      );
    }

    if (Aprobado && !Elaborado) {
      return NextResponse.json(
        { error: "No puede aprobar un documento no elaborado" },
        { status: 400 }
      );
    }

    if (Implementado && (!Elaborado || !Aprobado)) {
      return NextResponse.json(
        { error: "No puede implementar un documento sin elaborar y aprobar" },
        { status: 400 }
      );
    }

    if (Actualizado && (!Elaborado || !Aprobado || !Implementado)) {
      return NextResponse.json(
        { error: "No puede actualizar un documento sin los estados previos" },
        { status: 400 }
      );
    }

    if (Difundido && (!Elaborado || !Aprobado || !Implementado || !Actualizado)) {
      return NextResponse.json(
        { error: "No puede difundir un documento sin los estados previos" },
        { status: 400 }
      );
    }

    let pdfUrl: string | null = null;

    if (pdf && pdf.size > 0) {
      const bytes = await pdf.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
      await mkdir(uploadDir, { recursive: true });

      const safeName = `${Date.now()}-${pdf.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);

      await writeFile(filePath, buffer);
      pdfUrl = `/uploads/documents/${safeName}`;
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("Nombre", Nombre)
      .input("SubModuleId", SubModuleId)
      .input("Elaborado", Elaborado)
      .input("Aprobado", Aprobado)
      .input("Implementado", Implementado)
      .input("Actualizado", Actualizado)
      .input("Difundido", Difundido)
      .input("PdfUrl", pdfUrl)
      .query(`
        INSERT INTO Documentos_DGCI (
          Nombre,
          SubModuleId,
          Elaborado,
          Aprobado,
          Implementado,
          Actualizado,
          Difundido,
          PdfUrl,
          CreatedAt
        )
        OUTPUT
          INSERTED.DocumentId,
          INSERTED.Nombre,
          INSERTED.SubModuleId,
          INSERTED.Elaborado,
          INSERTED.Aprobado,
          INSERTED.Implementado,
          INSERTED.Actualizado,
          INSERTED.Difundido,
          INSERTED.PdfUrl
        VALUES (
          @Nombre,
          @SubModuleId,
          @Elaborado,
          @Aprobado,
          @Implementado,
          @Actualizado,
          @Difundido,
          @PdfUrl,
          GETDATE()
        )
      `);

    const newDocument = result.recordset[0];

    // Temporal: comenta auditoría para aislar el error
    /*
    await pool
      .request()
      .input("ActorUserId", 1)
      .input("Action", "CREATE_DOCUMENT")
      .input("Entity", "Documentos_DGCI")
      .input("EntityId", newDocument.DocumentId)
      .input(
        "Details",
        JSON.stringify({
          documento: newDocument.Nombre,
          subModuleId: SubModuleId,
          pdfUrl,
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
    */

    return NextResponse.json(newDocument);
  } catch (error: any) {
    console.error("POST /api/documents error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error al crear documento",
        sqlMessage: error?.originalError?.info?.message || null,
        code: error?.code || null,
        name: error?.name || null,
      },
      { status: 500 }
    );
  }
}