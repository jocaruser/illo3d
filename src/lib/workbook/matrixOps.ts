import {
  SHEET_HEADERS,
  type SheetName,
} from '@/services/sheets/config'
import { emptySheetMatrix, padSheetRow } from '@/services/sheets/sheetMatrix'

type TabsState = Partial<Record<SheetName, string[][]>>

export function cloneMatrix(matrix: string[][]): string[][] {
  return matrix.map((row) => [...row])
}

export function ensureMatrix(
  tabs: TabsState,
  sheetName: SheetName
): string[][] {
  const m = tabs[sheetName]
  if (m?.length) return cloneMatrix(m)
  return emptySheetMatrix(sheetName)
}

export function headerIndex(sheetName: SheetName, column: string): number {
  return SHEET_HEADERS[sheetName].indexOf(column as never)
}

/** Matrix row index (0 = header), or -1. */
export function findDataRowIndexById(
  matrix: string[][],
  sheetName: SheetName,
  id: string
): number {
  const idCol = headerIndex(sheetName, 'id')
  const needle = id.trim()
  for (let i = 1; i < matrix.length; i++) {
    if ((matrix[i][idCol] ?? '').trim() === needle) return i
  }
  return -1
}

/** Last data row with id (e.g. crm_notes duplicates by id in sheet). */
export function findLastDataRowIndexById(
  matrix: string[][],
  sheetName: SheetName,
  id: string
): number {
  const idCol = headerIndex(sheetName, 'id')
  const needle = id.trim()
  let last = -1
  for (let i = 1; i < matrix.length; i++) {
    if ((matrix[i][idCol] ?? '').trim() === needle) last = i
  }
  return last
}

export function removeDataRowAt(matrix: string[][], rowIdx: number): string[][] {
  return matrix.filter((_, i) => i !== rowIdx)
}

export function objectToMatrixRow(
  sheetName: SheetName,
  obj: Record<string, unknown>
): string[] {
  const headers = SHEET_HEADERS[sheetName]
  return headers.map((h) => {
    const v = obj[h]
    if (v === undefined || v === null) return ''
    return String(v).trim()
  })
}

export function appendDataRow(
  sheetName: SheetName,
  matrix: string[][],
  obj: Record<string, unknown>
): string[][] {
  const row = objectToMatrixRow(sheetName, obj)
  return [...matrix, padSheetRow(row, SHEET_HEADERS[sheetName].length)]
}

export function updateLastDataRowById(
  sheetName: SheetName,
  matrix: string[][],
  id: string,
  obj: Record<string, unknown>
): string[][] {
  const idx = findLastDataRowIndexById(matrix, sheetName, id)
  if (idx === -1) throw new Error(`Row ${id} not found in ${sheetName}`)
  return updateDataRowAtIndex(sheetName, matrix, idx, obj)
}

function updateDataRowAtIndex(
  sheetName: SheetName,
  matrix: string[][],
  idx: number,
  obj: Record<string, unknown>
): string[][] {
  const headers = SHEET_HEADERS[sheetName]
  const next = [...matrix]
  const prev = next[idx]
  const merged: Record<string, string> = {}
  headers.forEach((h, i) => {
    merged[h] = prev[i] ?? ''
  })
  for (const h of headers) {
    if (Object.prototype.hasOwnProperty.call(obj, h)) {
      const v = obj[h]
      merged[h] = v === undefined || v === null ? '' : String(v).trim()
    }
  }
  next[idx] = headers.map((h) => merged[h] ?? '')
  return next
}

export function updateDataRowById(
  sheetName: SheetName,
  matrix: string[][],
  id: string,
  obj: Record<string, unknown>
): string[][] {
  const idx = findDataRowIndexById(matrix, sheetName, id)
  if (idx === -1) throw new Error(`Row ${id} not found in ${sheetName}`)
  return updateDataRowAtIndex(sheetName, matrix, idx, obj)
}

export function setCell(
  matrix: string[][],
  rowIdx: number,
  colIdx: number,
  value: string
): string[][] {
  const next = cloneMatrix(matrix)
  const w = next[0]?.length ?? 0
  while (next[rowIdx].length < w) next[rowIdx].push('')
  next[rowIdx][colIdx] = value
  return next
}
