import { cloneMatrix, updateDataRowById } from '@/lib/workbook/matrixOps'
import { matrixToJobs, matrixToPieces } from '@/lib/workbook/workbookEntities'
import {
  countingPiecesForJob,
  piecePriceIsSet,
} from '@/utils/jobPiecePricing'
import { emptySheetMatrix, padSheetRow } from '@/services/sheets/sheetMatrix'
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from '@/services/sheets/config'

/** Exported for local CSV shop open: rewrite on-disk `pieces.csv` when headers lag the app schema. */
export function normalizePiecesSheetMatrix(matrix: string[][] | undefined): string[][] {
  if (!matrix?.length) return emptySheetMatrix('pieces')
  const canon = SHEET_HEADERS.pieces.map(String)
  const fileHeaders = matrix[0].map((c) => String(c ?? '').trim())
  if (
    fileHeaders.length === canon.length &&
    fileHeaders.every((h, i) => h === canon[i])
  ) {
    return cloneMatrix(matrix)
  }
  const idx = (name: string) => fileHeaders.indexOf(name)
  const rows: string[][] = [canon]
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row?.some((c) => String(c ?? '').trim() !== '')) continue
    const out = canon.map((h) => {
      const i = idx(h)
      return i >= 0 && row[i] !== undefined ? String(row[i]).trim() : ''
    })
    rows.push(padSheetRow(out, canon.length))
  }
  return rows
}

function migrateLegacyJobPricesInTabs(
  tabs: Record<SheetName, string[][]>,
): { tabs: Record<SheetName, string[][]>; modified: boolean } {
  let piecesMatrix = cloneMatrix(tabs.pieces ?? emptySheetMatrix('pieces'))
  let jobsMatrix = cloneMatrix(tabs.jobs ?? emptySheetMatrix('jobs'))
  let modified = false

  const jobs = matrixToJobs(jobsMatrix)
  for (const job of jobs) {
    if (job.deleted === 'true') continue
    const legacy = job.price
    if (
      legacy === undefined ||
      legacy === null ||
      Number.isNaN(Number(legacy))
    ) {
      continue
    }

    const pieces = matrixToPieces(piecesMatrix)
    const jobPieces = countingPiecesForJob(job.id, pieces).sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    )
    if (jobPieces.length === 0) continue
    if (jobPieces.some((p) => piecePriceIsSet(p))) continue

    const firstId = jobPieces[0].id
    piecesMatrix = updateDataRowById('pieces', piecesMatrix, firstId, {
      price: legacy,
    })
    jobsMatrix = updateDataRowById('jobs', jobsMatrix, job.id, { price: '' })
    modified = true
  }

  return {
    tabs: { ...tabs, pieces: piecesMatrix, jobs: jobsMatrix },
    modified,
  }
}

export function applyPiecePricingMigrations(
  tabs: Record<SheetName, string[][]>,
): { tabs: Record<SheetName, string[][]>; modified: boolean } {
  let modified = false
  const next = { ...tabs }
  const before = JSON.stringify(next.pieces)
  next.pieces = normalizePiecesSheetMatrix(next.pieces)
  if (JSON.stringify(next.pieces) !== before) modified = true

  const migrated = migrateLegacyJobPricesInTabs(next)
  return {
    tabs: migrated.tabs,
    modified: modified || migrated.modified,
  }
}

/** Seeds any missing sheets so migration can run in tests. */
export function ensureAllSheets(
  partial: Partial<Record<SheetName, string[][]>>,
): Record<SheetName, string[][]> {
  const tabs = {} as Record<SheetName, string[][]>
  for (const name of SHEET_NAMES) {
    tabs[name] = partial[name] ?? emptySheetMatrix(name)
  }
  return tabs
}
