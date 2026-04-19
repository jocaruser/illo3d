import { getBackend } from '@/config/csvBackend'
import { normalizePiecesSheetMatrix } from '@/lib/workbook/migratePiecePricing'
import type { SheetName } from '@/services/sheets/config'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useBackendStore } from '@/stores/backendStore'

async function readRawCsvMatrixFromHandle(
  sheetName: SheetName
): Promise<string[][] | null> {
  const handle = useBackendStore.getState().localDirectoryHandle
  if (!handle) return null
  try {
    const fileHandle = await handle.getFileHandle(`${sheetName}.csv`)
    const text = await (await fileHandle.getFile()).text()
    const lines = text.trimEnd().split(/\r?\n/)
    return lines.map((line) => line.split(',').map((c) => c.trim()))
  } catch {
    return null
  }
}

export function migratePiecesMatrixFromDiskSnapshot(
  matrix: string[][]
): string[][] | null {
  const migrated = normalizePiecesSheetMatrix(matrix)
  return JSON.stringify(migrated) === JSON.stringify(matrix) ? null : migrated
}

/**
 * Local shops store one CSV per sheet. `readSheetMatrix` pads rows to the *current*
 * header width, which mis-aligns legacy files (e.g. `units` added between `price`
 * and `created_at`). Rewrite `pieces.csv` from a raw parse before validation.
 */
export async function ensureLocalPiecesCsvCanonical(
  spreadsheetId: string
): Promise<void> {
  if (getBackend() !== 'local-csv') return
  if (!useBackendStore.getState().localDirectoryHandle) return

  const matrix = await readRawCsvMatrixFromHandle('pieces')
  if (!matrix?.length) return

  const migrated = migratePiecesMatrixFromDiskSnapshot(matrix)
  if (!migrated) return

  await getSheetsRepository().replaceSheetMatrix(spreadsheetId, 'pieces', migrated)
}
