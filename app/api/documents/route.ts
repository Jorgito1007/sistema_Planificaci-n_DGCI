import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { auth } from "@/auth";
import { getCurrentUserId } from "@/lib/current-user";
import { sendMail } from "@/lib/sendMail";
import {
  validarArchivoSubido,
  guardarArchivo,
} from "@/lib/upload-documentos";


export async function POST(req: Request) {
  try {
    const actorUserId = await getCurrentUserId();

if (!actorUserId) {
  return NextResponse.json(
    { error: "No se pudo obtener el UserId del usuario autenticado" },
    { status: 401 }
  );
}

    const formData = await req.formData();

    const Nombre = String(formData.get("Nombre") || "").trim();
    const SubModuleId = Number(formData.get("SubModuleId"));

    // Datos para vincular el documento con una pregunta de una matriz
const TipoMatriz = String(
  formData.get("TipoMatriz") || ""
).trim();

const QuestionIdRaw = formData.get("QuestionId");

const QuestionId =
  QuestionIdRaw !== null && String(QuestionIdRaw).trim() !== ""
    ? Number(QuestionIdRaw)
    : null;

const OrigenMatriz =
  String(formData.get("OrigenMatriz") || "") === "true";

    const Elaborado = String(formData.get("Elaborado")) === "true";
    const Aprobado = String(formData.get("Aprobado")) === "true";
    const Implementado = String(formData.get("Implementado")) === "true";
    const Actualizado = String(formData.get("Actualizado")) === "true";
    const Difundido = String(formData.get("Difundido")) === "true";

    const Fecha_Aprobado = String(formData.get("Fecha_Aprobado") || "").trim();
    const Fecha_Actualizado = String(formData.get("Fecha_Actualizado") || "").trim();

    const file = formData.get("file") as File | null;

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

    // Si el documento viene desde una matriz,
// debe indicar la matriz y la pregunta.
if (OrigenMatriz) {
  if (
    TipoMatriz !== "SISTEMA_ADMINISTRATIVO" &&
    TipoMatriz !== "COMPONENTE"
  ) {
    return NextResponse.json(
      { error: "El tipo de matriz es inválido" },
      { status: 400 }
    );
  }

  if (
    QuestionId === null ||
    Number.isNaN(QuestionId) ||
    QuestionId <= 0
  ) {
    return NextResponse.json(
      { error: "El QuestionId es inválido" },
      { status: 400 }
    );
  }
}

   // La página tradicional de documentos conserva
// las validaciones secuenciales.
// Cuando viene desde una matriz, los estados ya fueron
// determinados por la evaluación de la pregunta.
if (!OrigenMatriz) {
  if (Aprobado && !Elaborado) {
    return NextResponse.json(
      { error: "No puede aprobar un documento no elaborado" },
      { status: 400 }
    );
  }

  if (Implementado && (!Elaborado || !Aprobado)) {
    return NextResponse.json(
      {
        error:
          "No puede implementar un documento sin elaborar y aprobar",
      },
      { status: 400 }
    );
  }

  if (
    Actualizado &&
    (!Elaborado || !Aprobado || !Implementado)
  ) {
    return NextResponse.json(
      {
        error:
          "No puede actualizar un documento sin los estados previos",
      },
      { status: 400 }
    );
  }

  if (
    Difundido &&
    (!Elaborado ||
      !Aprobado ||
      !Implementado ||
      !Actualizado)
  ) {
    return NextResponse.json(
      {
        error:
          "No puede difundir un documento sin los estados previos",
      },
      { status: 400 }
    );
  }
}


    if (Aprobado && !Fecha_Aprobado) {
      return NextResponse.json(
        { error: "Debe seleccionar la fecha de aprobado" },
        { status: 400 }
      );
    }

    if (Actualizado && !Fecha_Actualizado) {
      return NextResponse.json(
        { error: "Debe seleccionar la fecha de actualizado" },
        { status: 400 }
      );
    }

    let pdfUrl: string | null = null;

    if (file && file.size > 0) {
      const resultado = await validarArchivoSubido(file);

      if (!resultado.ok) {
        return NextResponse.json(
          { error: resultado.error },
          { status: 400 }
        );
      }

      await guardarArchivo(resultado.safeName, resultado.buffer);

      pdfUrl = `/api/documents/file/${resultado.safeName}`;
    }

    

    const pool = await getPool();


const userResult = await pool
  .request()
  .input("UserId", actorUserId)
  .query(`
    SELECT TOP 1
      FullName,
      Email
    FROM dbo.Usuarios_Dgci
    WHERE UserId = @UserId
  `);

  
const usuarioNombre =
  userResult.recordset[0]?.FullName || "Usuario no identificado";

const usuarioEmail =
  userResult.recordset[0]?.Email || "Correo no identificado";

    const result = await pool
      .request()
      .input("Nombre", Nombre)
      .input("SubModuleId", SubModuleId)
      .input("Elaborado", Elaborado)
      .input("Aprobado", Aprobado)
      .input("Fecha_Aprobado", Aprobado ? Fecha_Aprobado : null)
      .input("Implementado", Implementado)
      .input("Actualizado", Actualizado)
      .input("Fecha_Actualizado", Actualizado ? Fecha_Actualizado : null)
      .input("Difundido", Difundido)
      .input("PdfUrl", pdfUrl)
      .input("ActorUserId", actorUserId)
      .query(`
        INSERT INTO Documentos_DGCI (
          Nombre,
          SubModuleId,
          Elaborado,
          Aprobado,
          Fecha_Aprobado,
          Implementado,
          Actualizado,
          Fecha_Actualizado,
          Difundido,
          PdfUrl,
          CreatedAt,
          UpdatedAt,
          ActorUserId
        )
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
        VALUES (
          @Nombre,
          @SubModuleId,
          @Elaborado,
          @Aprobado,
          @Fecha_Aprobado,
          @Implementado,
          @Actualizado,
          @Fecha_Actualizado,
          @Difundido,
          @PdfUrl,
          GETDATE(),
          GETDATE(),
          @ActorUserId
        )
      `);


      
    const newDocument = result.recordset[0];

    // =====================================================
// VINCULAR DOCUMENTO CON LA PREGUNTA DE LA MATRIZ
// =====================================================

if (OrigenMatriz && QuestionId !== null) {

  // MATRIZ DEL SISTEMA ADMINISTRATIVO
  if (TipoMatriz === "SISTEMA_ADMINISTRATIVO") {
    const updateResult = await pool
      .request()
      .input("QuestionId", QuestionId)
      .input("DocumentId", newDocument.DocumentId)
      .query(`
        UPDATE dbo.Matriz_SistemaAdministrativoDetalle
        SET DocumentId = @DocumentId
        WHERE Id = @QuestionId
      `);

    if (!updateResult.rowsAffected[0]) {
      throw new Error(
        "No se encontró la pregunta en la Matriz del Sistema Administrativo."
      );
    }
  }

  // MATRIZ POR COMPONENTES
  if (TipoMatriz === "COMPONENTE") {
    const updateResult = await pool
      .request()
      .input("QuestionId", QuestionId)
      .input("DocumentId", newDocument.DocumentId)
      .query(`
        UPDATE dbo.EvaluacionesPrincipioDetalleDGCI
        SET DocumentId = @DocumentId
        WHERE Id = @QuestionId
      `);

    if (!updateResult.rowsAffected[0]) {
      throw new Error(
        "No se encontró la pregunta en la Matriz por Componentes."
      );
    }
  }
}


const subModuleResult = await pool
  .request()
  .input("SubModuleId", newDocument.SubModuleId)
  .query(`
    SELECT SubModuleName
    FROM dbo.submodulos_dgci
    WHERE SubModuleId = @SubModuleId
  `);
const nombreSubModulo =
  subModuleResult.recordset[0]?.SubModuleName || "Submódulo no identificado";

// Correo de alerta

const correosCopia: string[] = process.env.CORREOS_COPIA_DGCI
  ? process.env.CORREOS_COPIA_DGCI.split(",")
      .map((correo) => correo.trim())
      .filter(Boolean)
  : [];


try {
  await sendMail({
    to: process.env.DIRECTOR_EMAIL!,
    cc: correosCopia,
    subject: `Nuevo documento subido - ${nombreSubModulo}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <div style="text-align:center;">
          <img width="400" height="97" src="https://nuevoingreso.uncsm.edu.ni/img/logo-color.png" />
        </div>

        <p><strong>Estimado(a):</strong></p>

        <p>
          Se informa que el usuario <strong>${usuarioNombre}</strong>
          ha subido un nuevo documento al Sistema de Control Interno DGCI.
        </p>

        <p><strong>Documento:</strong> ${newDocument.Nombre}</p>
        <p><strong>Submódulo:</strong> ${nombreSubModulo}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-NI")}</p>

      
        <br />

        <p>No es necesario responder este correo.</p>

        <p>Universidad Nacional Casimiro Sotelo Montenegro</p>
        <p><i>¡Revolucionando la Conciencia, Llegamos a la Libertad!</i></p>
      </div>
    `,
  });

  console.log("Correo enviado correctamente");
} catch (error) {
  console.error("Error enviando correo:", error);
}

  //Auditoria de datos
    await pool
      .request()
      .input("ActorUserId", actorUserId)
      .input("Action", "CREATE_DOCUMENT")
      .input("Entity", "Documentos_DGCI")
      .input("EntityId", String(newDocument.DocumentId))
      .input(
        "Details",
        JSON.stringify({
  documentId: newDocument.DocumentId,
  documento: newDocument.Nombre,

  origenMatriz: OrigenMatriz,
  tipoMatriz: OrigenMatriz ? TipoMatriz : null,
  questionId: OrigenMatriz ? QuestionId : null,

  subModuleId: newDocument.SubModuleId,
  elaborado: newDocument.Elaborado,
  aprobado: newDocument.Aprobado,
  fechaAprobado: newDocument.Fecha_Aprobado,
  implementado: newDocument.Implementado,
  actualizado: newDocument.Actualizado,
  fechaActualizado: newDocument.Fecha_Actualizado,
  difundido: newDocument.Difundido,
  pdfUrl: newDocument.PdfUrl,
  creadoPor: usuarioNombre,
  fechaCreacion: new Date().toISOString(),
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

    return NextResponse.json(newDocument);
  } catch (error: any) {
    console.error("POST /api/documents error:", error);

    return NextResponse.json(
      {
        error: "Error al crear documento",
      },
      { status: 500 }
    );
  }
}