import { getBackend, isCsvBackendEnabled } from '@/config/csvBackend'
import { normalizePiecesSheetMatrix } from '@/lib/workbook/migratePiecePricing'
import { useBackendStore } from '@/stores/backendStore'
import { sheetsFetch } from '@/services/sheets/client'
import { getSheetsRepository } from '@/services/sheets/repository'

/**
 * Reads the pieces tab exactly as stored in Google Sheets (ragged rows, legacy headers).
 */
export async function readRawSheetValuesMatrix(
  spreadsheetId: string,
  sheetTitle: string,
): Promise<string[][]> {
  const escaped = sheetTitle.replace(/'/g, "''")
  const range = `'${escaped}'!A:ZZ`
  const response = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  )
  if (!response.ok) return []
  const data = (await response.json()) as { values?: unknown[][] }
  const raw = data.values ?? []
  return raw.map((row) =>
    (row as unknown[] | undefined)?.map((c) => String(c ?? '').trim()) ?? [],
  )
}

/**
 * Rewrites the `pieces` tab when headers/columns lag the app schema (e.g. missing `units`,
 * `archived`, `deleted`). Local disk shops use {@link ensureLocalPiecesCsvCanonical} instead.
 */
export async function ensurePiecesSheetCanonicalRemote(
  spreadsheetId: string,
): Promise<void> {
  if (isCsvBackendEnabled()) return
  if (getBackend() === 'local-csv' && useBackendStore.getState().localDirectoryHandle) {
    return
  }

  const matrix = await readRawSheetValuesMatrix(spreadsheetId, 'pieces')
  if (!matrix.length) return

  const migrated = normalizePiecesSheetMatrix(matrix)
  if (JSON.stringify(migrated) === JSON.stringify(matrix)) return

  await getSheetsRepository().replaceSheetMatrix(spreadsheetId, 'pieces', migrated)
}
