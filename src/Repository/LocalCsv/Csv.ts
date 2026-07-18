/**
 * RFC 4180 CSV codec for the Local CSV backend. Handles quoted fields with
 * `""` escapes, embedded commas/quotes/newlines (audit_log JSON snapshots
 * round-trip), and tolerates both LF and CRLF input.
 */

/**
 * Cells opening with a formula trigger (`=`, `+`, `-`, `@`, tab) execute as
 * formulas/DDE when the exported file is opened in Excel or LibreOffice (CSV
 * formula injection). Such cells are stored with a leading apostrophe — the
 * spreadsheet convention for "literal text" — and the apostrophe is stripped
 * again on parse so values round-trip unchanged (a genuine leading `'` before
 * a trigger gains one more `'` on write, symmetric with the strip). Plain
 * numbers are exempt: negative amounts are data, not formulas.
 */
const FORMULA_TRIGGER = /^'*[=+\-@\t]/

function needsFormulaGuard(cell: string): boolean {
  // A cell that parses as a number is data (e.g. a negative amount), not a formula.
  return FORMULA_TRIGGER.test(cell) && Number.isNaN(Number(cell))
}

function unguardCell(cell: string): string {
  if (cell.startsWith("'") && needsFormulaGuard(cell.slice(1))) return cell.slice(1)
  return cell
}

/** Parse CSV text into rows of string cells. Empty text → no rows. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (inQuotes) {
      if (char !== '"') {
        cell += char
      } else if (text[index + 1] === '"') {
        cell += '"'
        index++
      } else {
        inQuotes = false
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.map((cells) => cells.map(unguardCell))
}

/** Serialize rows to CRLF-terminated CSV, quoting cells that need it. */
export function serializeCsv(matrix: string[][]): string {
  if (matrix.length === 0) return ''
  return (
    matrix.map((row) => row.map(serializeCell).join(',')).join('\r\n') + '\r\n'
  )
}

function serializeCell(cell: string): string {
  const guarded = needsFormulaGuard(cell) ? `'${cell}` : cell
  if (!/[",\r\n]/.test(guarded)) return guarded
  return `"${guarded.replace(/"/g, '""')}"`
}
