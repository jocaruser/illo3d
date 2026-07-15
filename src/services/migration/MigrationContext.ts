import type { SheetName } from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import type { Backend } from '@/stores/backendStore'

export interface MigrationContext {
  backend: Backend
  /** Routes repository calls to the working copy (the local backend ignores it). */
  workingSpreadsheetId: string
  /** Repository bound to the working copy — the source shop is never touched. */
  repo: SheetsRepository
  /** Creates the sheet with canonical headers when it does not exist yet. */
  ensureSheet(sheetName: SheetName): Promise<void>
}
