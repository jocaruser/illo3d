/**
 * RFC 4180 CSV codec for the Local CSV backend. Handles quoted fields with
 * `""` escapes, embedded commas/quotes/newlines (audit_log JSON snapshots
 * round-trip), and tolerates both LF and CRLF input.
 */

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
  return rows
}

/** Serialize rows to CRLF-terminated CSV, quoting cells that need it. */
export function serializeCsv(matrix: string[][]): string {
  if (matrix.length === 0) return ''
  return (
    matrix.map((row) => row.map(serializeCell).join(',')).join('\r\n') + '\r\n'
  )
}

function serializeCell(cell: string): string {
  if (!/[",\r\n]/.test(cell)) return cell
  return `"${cell.replace(/"/g, '""')}"`
}
