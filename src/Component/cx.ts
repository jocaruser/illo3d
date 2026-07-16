/** Joins class names, dropping falsy segments. */
export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
