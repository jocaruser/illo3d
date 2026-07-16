import { SHEET_HEADERS, type SheetName } from '@/Config/schema'
import type { SheetRecord } from '@/Entity/SheetEntity'
import type { SheetMatrix } from './WorkbookRepositoryInterface'

/**
 * Pure helpers to work with sheet matrices (header row + data rows).
 * All workbook mutations funnel through these so shape invariants hold:
 * canonical header, every row padded/truncated to header width.
 */

/** Normalize a raw matrix to the canonical shape for a sheet. */
export function normalizeMatrix(sheet: SheetName, matrix: SheetMatrix): SheetMatrix {
  const header = [...SHEET_HEADERS[sheet]]
  const rows = matrix
    .slice(1)
    .map((row) => padRow(row, header.length))
    .filter((row) => row.some((cell) => cell.trim() !== ''))
  return [header, ...rows]
}

function padRow(row: string[], width: number): string[] {
  const padded = row.slice(0, width).map((cell) => cell ?? '')
  while (padded.length < width) padded.push('')
  return padded
}

/** Build an empty matrix (header only) for a sheet. */
export function emptyMatrix(sheet: SheetName): SheetMatrix {
  return [[...SHEET_HEADERS[sheet]]]
}

/** Convert a data row array to a record keyed by the sheet's canonical headers. */
export function rowToRecord(sheet: SheetName, row: string[]): SheetRecord {
  const record: SheetRecord = {}
  SHEET_HEADERS[sheet].forEach((column, index) => {
    record[column] = row[index] ?? ''
  })
  return record
}

/** Convert a record back to a data row in canonical column order. */
export function recordToRow(sheet: SheetName, record: SheetRecord): string[] {
  return SHEET_HEADERS[sheet].map((column) => record[column] ?? '')
}

/** All data rows of a matrix as records. */
export function matrixToRecords(sheet: SheetName, matrix: SheetMatrix): SheetRecord[] {
  return matrix.slice(1).map((row) => rowToRecord(sheet, row))
}

/** Index of the data row whose `id` column matches (0-based over data rows), or -1. */
export function findRowIndexById(sheet: SheetName, matrix: SheetMatrix, id: string): number {
  const idColumn = SHEET_HEADERS[sheet].indexOf('id')
  return matrix.slice(1).findIndex((row) => (row[idColumn] ?? '') === id)
}

/** Return a new matrix with the record appended as the last data row. */
export function appendRecord(sheet: SheetName, matrix: SheetMatrix, record: SheetRecord): SheetMatrix {
  return [...matrix, recordToRow(sheet, record)]
}

/**
 * Return a new matrix with the row matching `record.id` replaced.
 * Throws when the id is not present — callers decide create vs update.
 */
export function updateRecordById(
  sheet: SheetName,
  matrix: SheetMatrix,
  record: SheetRecord,
): SheetMatrix {
  const index = findRowIndexById(sheet, matrix, record.id ?? '')
  if (index === -1) {
    throw new Error(`Row '${record.id}' not found in sheet '${sheet}'`)
  }
  const next = [...matrix]
  next[index + 1] = recordToRow(sheet, record)
  return next
}

/** Return a new matrix without the row matching `id` (used for hard-deleted tag links). */
export function removeRecordById(sheet: SheetName, matrix: SheetMatrix, id: string): SheetMatrix {
  const index = findRowIndexById(sheet, matrix, id)
  if (index === -1) return matrix
  return matrix.filter((_, rowIndex) => rowIndex !== index + 1)
}

/** Record for `id`, or null. */
export function findRecordById(sheet: SheetName, matrix: SheetMatrix, id: string): SheetRecord | null {
  const index = findRowIndexById(sheet, matrix, id)
  if (index === -1) return null
  return rowToRecord(sheet, matrix[index + 1])
}
