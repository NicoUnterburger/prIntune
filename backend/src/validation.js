// Gemeinsame Eingabe-Validierung.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// IDs stammen aus uuid v4 und werden zu Dateipfaden zusammengesetzt.
// Strikte Prüfung verhindert Path-Traversal (z.B. "../../etc").
export function isValidId(id) {
  return typeof id === 'string' && UUID_RE.test(id);
}
