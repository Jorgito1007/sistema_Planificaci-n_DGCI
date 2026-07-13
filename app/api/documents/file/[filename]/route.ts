import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { filename } = await context.params;

    if (!filename) {
      return NextResponse.json(
        { error: "Nombre de archivo inválido" },
        { status: 400 }
      );
    }

    const safeFilename = path.basename(filename);

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "documents",
      safeFilename
    );

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Archivo no encontrado", filePath },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    const ext = path.extname(safeFilename).toLowerCase();

    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".doc"
        ? "application/msword"
        : ext === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "No se pudo leer el archivo",
        detail: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}