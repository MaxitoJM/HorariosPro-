// Helpers seguros para construir HTML por interpolación de strings.
//
// Mientras el frontend siga renderizando con innerHTML, cualquier dato
// proveniente del usuario o de la base de datos debe pasar por escapeHtml
// para evitar XSS. Aplicar especialmente en: nombres, apellidos, emails,
// descripciones, códigos editables, mensajes de error del backend.
//
// Cuando migremos a un framework reactivo (Fase 8), este helper queda
// obsoleto porque la librería escapará automáticamente.

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

/**
 * Escapa los 5 caracteres peligrosos para interpolación en HTML.
 * Acepta null/undefined/number devolviendo string vacío o el número como string.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** Alias corto y reconocible en templates: `${h(item.nombre)}` */
export const h = escapeHtml;
