import { SHEET_NAMES } from '@/Config/schema'
import { normalizeMatrix } from '@/Repository/Matrix'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'
import { useOperationStore } from '@/Store/operationStore'
import { useWorkbookStore, type WorkbookTabs } from '@/Store/workbookStore'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Unit of work over the whole workbook: hydrate / refresh read every sheet
 * into the snapshot store, save writes every sheet back. Progress is streamed
 * to the operation store; loads are non-blocking, saves block the UI.
 */
export class WorkbookService {
  constructor(
    private readonly repo: WorkbookRepositoryInterface,
    private readonly workbookId: string
  ) {}

  async hydrate(): Promise<void> {
    useOperationStore.getState().start('load', {
      total: SHEET_NAMES.length,
      blocking: false,
      message: 'workbook.loadingWorkbook',
    })
    useWorkbookStore.getState().setStatus('loading')
    try {
      const tabs = {} as WorkbookTabs
      let loaded = 0
      // Sheets are independent, so read them all at once and report progress
      // as each one completes.
      await Promise.all(
        SHEET_NAMES.map(async (sheet) => {
          const matrix = await this.repo.readSheetMatrix(this.workbookId, sheet)
          tabs[sheet] = normalizeMatrix(sheet, matrix)
          loaded += 1
          useOperationStore.getState().progress(loaded, sheet)
        })
      )
      useWorkbookStore.getState().hydrateTabs(tabs, this.workbookId)
    } catch (error) {
      useWorkbookStore.getState().setStatus('error', errorMessage(error))
      throw error
    } finally {
      useOperationStore.getState().finish()
    }
  }

  /**
   * Write every sheet back. `blocking` chooses the progress face: the modal
   * overlay by default, or none when the save preview shows its own per-sheet
   * stepper from the operation store.
   */
  async save(options: { blocking?: boolean } = {}): Promise<void> {
    useWorkbookStore.getState().beginSave()
    useOperationStore.getState().start('save', {
      total: SHEET_NAMES.length,
      blocking: options.blocking ?? true,
      message: 'workbook.savingWorkbook',
    })
    try {
      const snapshot = useWorkbookStore.getState().tabs
      let written = 0
      // The snapshot has no cross-sheet ordering requirement, so write every
      // sheet at once and report progress as each one completes.
      await Promise.all(
        SHEET_NAMES.map(async (sheet) => {
          try {
            await this.repo.replaceSheetMatrix(
              this.workbookId,
              sheet,
              snapshot[sheet]
            )
          } catch (error) {
            useOperationStore.getState().fail(sheet)
            throw error
          }
          written += 1
          useOperationStore.getState().progress(written, sheet)
        })
      )
      useWorkbookStore.getState().endSave(true)
      // Audit rows in the written snapshot are now persisted; rows appended
      // after this count are the next save's diff.
      useWorkbookStore.getState().setSavedAuditRows(snapshot.audit_log.length - 1)
    } catch (error) {
      useWorkbookStore.getState().endSave(false)
      throw error
    } finally {
      useOperationStore.getState().finish()
    }
  }

  /** Re-read everything, discarding local edits. Callers confirm when dirty. */
  refresh(): Promise<void> {
    return this.hydrate()
  }
}
