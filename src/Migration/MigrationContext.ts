import type { SheetName } from '@/Config/schema'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'

/**
 * Everything a migration step needs to read and rewrite the isolated working
 * copy. Steps never see the original shop — the target owns the working copy
 * lifecycle and only its `commit` touches the source.
 */
export interface MigrationContext {
  backend: 'local-csv' | 'google-drive'
  /** Workbook id of the working copy (spreadsheet id or synthetic local id). */
  workingWorkbookId: string
  repo: WorkbookRepositoryInterface
  /** Create a sheet with its canonical header when absent (idempotent). */
  ensureSheet(sheet: SheetName): Promise<void>
}
