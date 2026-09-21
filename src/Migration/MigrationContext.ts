import type { SheetName } from '@/Config/schema'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'

/**
 * Everything a migration step needs to read and rewrite the in-memory session
 * snapshot. Steps never touch the shop at rest; the target's `submit` is the
 * sole persistence boundary after the owner confirms.
 */
export interface MigrationContext {
  backend: 'local-csv' | 'google-drive'
  /** Workbook id for the in-memory session (synthetic local id or Drive id). */
  workingWorkbookId: string
  repo: WorkbookRepositoryInterface
  /** Create a sheet with its canonical header when absent (idempotent). */
  ensureSheet(sheet: SheetName): Promise<void>
}
