import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { getCurrentUserId } from "@/lib/current-user";
import { rutaFisicaDesdeNombre } from "@/lib/upload-documentos";

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

const MIME_POR_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(req: Request, context: RouteContext) {
  try {
    /**
     * Los documentos son datos privados: solo se sirven
     * a usuarios autenticados (login por contraseña o Google).
     */
    const userId = await getCurrentUserId();

    if (!userId) {
      /**
       * Navegación desde el navegador (click en el enlace):
       * redirigir al login. Peticiones XHR/API: 401 JSON.
       */
      const accept = req.headers.get("accept") || "";

      if (accept.includes("text/html")) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }

      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { filename } = await context.params;

    if (!filename) {
      return NextResponse.json(
        { error: "Nombre de archivo inválido" },
        { status: 400 }
      );
    }

    /**
     * rutaFisicaDesdeNombre usa path.basename: impide path traversal.
     * Los archivos viven en uploads/documents (FUERA de public/,
     * por lo que Next.js no los sirve como estáticos).
     */
    const filePath = rutaFisicaDesdeNombre(filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      MIME_POR_EXTENSION[ext] || "application/octet-stream";

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
        path.basename(filePath)
      )}`,
      /**
       * Refuerzo anti-sniffing (además del header global).
       */
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/documents/file error:", error);

    /**
     * Nunca exponer detalles internos (rutas físicas, mensajes de BD).
     */
    return NextResponse.json(
      { error: "No se pudo leer el archivo" },
      { status: 500 }
    );
  }
}
