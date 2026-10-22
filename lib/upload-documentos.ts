import path from "path";
import { mkdir, writeFile } from "fs/promises";

/**
 * Validación y almacenamiento centralizado de documentos subidos.
 *
 * Reglas de seguridad:
 * 1. La extensión es obligatoria y debe estar en la lista blanca.
 * 2. El Content-Type del navegador es solo complementario: si viene y no
 *    está en la lista blanca, se rechaza.
 * 3. Se verifica la "firma mágica" (magic bytes) del archivo para asegurar
 *    que el contenido real coincide con la extensión declarada.
 *    Esto bloquea archivos HTML renombrados a .pdf (XSS almacenado).
 * 4. Los archivos se guardan FUERA de public/, por lo que nunca se sirven
 *    como estáticos: solo son accesibles por la API autenticada
 *    /api/documents/file/[filename].
 */

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Directorio privado de almacenamiento.
 * IMPORTANTE: debe permanecer fuera de public/ para que Next.js
 * no lo sirva sin autenticación.
 */
export const UPLOADS_DIR = path.join(process.cwd(), "uploads", "documents");

const EXTENSIONES_PERMITIDAS = [".pdf", ".doc", ".docx"];

const MIME_PERMITIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type ResultadoValidacionArchivo =
  | {
      ok: true;
      ext: string;
      safeName: string;
      buffer: Buffer;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Verifica la firma binaria inicial del archivo.
 */
function coincideFirma(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0) {
    return false;
  }

  if (ext === ".pdf") {
    /**
     * El estándar permite basura antes de "%PDF-" dentro
     * de los primeros 1024 bytes.
     */
    const inicio = buffer.subarray(0, 1024).toString("latin1");
    return inicio.includes("%PDF-");
  }

  if (ext === ".docx") {
    /** ZIP: PK\x03\x04 */
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  if (ext === ".doc") {
    /** OLE2: D0 CF 11 E0 A1 B1 1A E1 */
    return (
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1
    );
  }

  return false;
}

/**
 * Genera un nombre base seguro para el archivo físico:
 * sin separadores de ruta, sin caracteres de control,
 * sin puntos iniciales y con longitud limitada.
 */
function sanitizarNombreBase(nombre: string): string {
  const limpio = nombre
    .replace(/[\\/:*?"<>|]/g, "_")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^\.+/, "_")
    .slice(0, 80)
    .replace(/[._]+$/, "");

  return limpio || "documento";
}

/**
 * Valida un archivo subido y devuelve el buffer listo para guardar.
 */
export async function validarArchivoSubido(
  file: File
): Promise<ResultadoValidacionArchivo> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Debe seleccionar un archivo" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: "El archivo no puede superar los 20 MB",
    };
  }

  const nombreArchivo = file.name || "";
  const ext = path.extname(nombreArchivo).toLowerCase();

  /**
   * 1. La extensión es obligatoria y debe estar en la lista blanca.
   */
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    return {
      ok: false,
      error: "Solo se permiten archivos PDF, DOC o DOCX",
    };
  }

  /**
   * 2. Si el navegador envía un Content-Type, debe ser compatible.
   */
  const mime = (file.type || "").toLowerCase().split(";")[0].trim();

  if (
    mime &&
    mime !== "application/octet-stream" &&
    !MIME_PERMITIDOS.includes(mime)
  ) {
    return {
      ok: false,
      error: "Solo se permiten archivos PDF, DOC o DOCX",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  /**
   * 3. La firma binaria debe coincidir con la extensión declarada.
   */
  if (!coincideFirma(buffer, ext)) {
    return {
      ok: false,
      error:
        "El archivo no corresponde a su extensión o está dañado. Verifique que sea un PDF, DOC o DOCX válido.",
    };
  }

  const base = sanitizarNombreBase(
    path.basename(nombreArchivo, path.extname(nombreArchivo))
  );

  return {
    ok: true,
    ext,
    safeName: `${Date.now()}-${base}${ext}`,
    buffer,
  };
}

/**
 * Guarda el archivo validado en el directorio privado.
 */
export async function guardarArchivo(
  safeName: string,
  buffer: Buffer
): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const filePath = path.join(UPLOADS_DIR, safeName);

  await writeFile(filePath, buffer);

  return filePath;
}

/**
 * Devuelve la ruta física de un PdfUrl almacenado (ej.:
 * "/api/documents/file/123-archivo.pdf"), o null si no es válido.
 * Usa path.basename para impedir path traversal.
 */
export function rutaFisicaDesdeUrl(pdfUrl: string | null): string | null {
  if (!pdfUrl) {
    return null;
  }

  const fileName = pdfUrl.split("/").pop();

  if (!fileName) {
    return null;
  }

  const safeFileName = path.basename(decodeURIComponent(fileName));

  return path.join(UPLOADS_DIR, safeFileName);
}

/**
 * Ruta física directa desde un nombre de archivo.
 */
export function rutaFisicaDesdeNombre(filename: string): string {
  return path.join(UPLOADS_DIR, path.basename(filename));
}
