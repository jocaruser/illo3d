import { create } from 'zustand'
import { SHEET_NAMES, type SheetName } from '@/Config/schema'
import { emptyMatrix } from '@/Repository/Matrix'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'

export type WorkbookStatus = 'idle' | 'loading' | 'ready' | 'error'

export type WorkbookTabs = Record<SheetName, SheetMatrix>

export function emptyTabs(): WorkbookTabs {
  return Object.fromEntries(SHEET_NAMES.map((sheet) => [sheet, emptyMatrix(sheet)])) as WorkbookTabs
}

/**
 * In-memory snapshot of the whole workbook — the single source of truth for
 * every UI read. Mutations happen here (and only here) until the user saves;
 * `WorkbookService` moves data between this store and the active
 * `WorkbookRepositoryInterface` implementation.
 */
export interface WorkbookState {
  tabs: WorkbookTabs
  status: WorkbookStatus
  error: string | null
  dirty: boolean
  workbookId: string | null
  saveInProgress: boolean
  /** True when a mutation landed while a save was writing — keeps dirty set. */
  mutatedDuringSave: boolean

  /** Replace the whole snapshot after hydrate/refresh. Marks the store clean and ready. */
  hydrateTabs(tabs: WorkbookTabs, workbookId: string): void
  /** Apply an in-memory mutation to one tab and mark the workbook dirty. */
  mutateTab(sheet: SheetName, mutate: (matrix: SheetMatrix) => SheetMatrix): void
  setStatus(status: WorkbookStatus, error?: string | null): void
  beginSave(): void
  /** End a save; on success the store becomes clean unless mutated mid-save. */
  endSave(success: boolean): void
  reset(): void
}

export const useWorkbookStore = create<WorkbookState>()((set) => ({
  tabs: emptyTabs(),
  status: 'idle',
  error: null,
  dirty: false,
  workbookId: null,
  saveInProgress: false,
  mutatedDuringSave: false,

  hydrateTabs: (tabs, workbookId) =>
    set({ tabs, workbookId, status: 'ready', error: null, dirty: false, mutatedDuringSave: false }),

  mutateTab: (sheet, mutate) =>
    set((state) => ({
      tabs: { ...state.tabs, [sheet]: mutate(state.tabs[sheet]) },
      dirty: true,
      mutatedDuringSave: state.saveInProgress ? true : state.mutatedDuringSave,
    })),

  setStatus: (status, error = null) => set({ status, error }),

  beginSave: () => set({ saveInProgress: true, mutatedDuringSave: false }),

  endSave: (success) =>
    set((state) => ({
      saveInProgress: false,
      dirty: success ? state.mutatedDuringSave : state.dirty,
      mutatedDuringSave: false,
    })),

  reset: () =>
    set({
      tabs: emptyTabs(),
      status: 'idle',
      error: null,
      dirty: false,
      workbookId: null,
      saveInProgress: false,
      mutatedDuringSave: false,
    }),
}))
