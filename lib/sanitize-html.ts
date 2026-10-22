/**
 * Utilidades de saneamiento para contenido que se interpola
 * en HTML (plantillas de correo y Swal.fire({ html })).
 */

/**
 * Escapa caracteres especiales de HTML para que valores
 * provenientes de la base de datos no puedan inyectar
 * marcación (XSS almacenado).
 */
export function escapeHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapa un valor para usarlo dentro de un atributo HTML.
 * (Igual que escapeHtml; existe por claridad de intención.)
 */
export function escapeHtmlAttr(valor: unknown): string {
  return escapeHtml(valor);
}
