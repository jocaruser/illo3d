import { create } from 'zustand'
import { SHEET_NAMES, type SheetName } from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import { emptySheetMatrix } from '@/services/sheets/sheetMatrix'
import type {
  Client,
  CrmNote,
  Expense,
  Inventory,
  Job,
  Piece,
  PieceItem,
  Tag,
  TagLink,
  Transaction,
} from '@/types/money'
import {
  matrixToClients,
  matrixToCrmNotes,
  matrixToExpenses,
  matrixToInventory,
  matrixToJobs,
  matrixToPieceItems,
  matrixToPieces,
  matrixToTagLinks,
  matrixToTags,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'

export type WorkbookStatus = 'idle' | 'loading' | 'ready' | 'error'

type TabsState = Partial<Record<SheetName, string[][]>>

async function loadAllTabs(
  repository: SheetsRepository,
  spreadsheetId: string
): Promise<{
  tabs: Record<SheetName, string[][]>
  sheetIds: Partial<Record<SheetName, number>>
}> {
  const entries = await Promise.all(
    SHEET_NAMES.map(async (name) => {
      const matrix = await repository.readSheetMatrix(spreadsheetId, name)
      return [name, matrix] as const
    })
  )
  const tabs = Object.fromEntries(entries) as Record<SheetName, string[][]>
  const sheetIds = await repository.getSheetIdMap(spreadsheetId)
  return { tabs, sheetIds }
}

export interface WorkbookState {
  tabs: TabsState
  sheetIds: Partial<Record<SheetName, number>>
  dirty: boolean
  status: WorkbookStatus
  error: string | null
  spreadsheetId: string | null
  reset: () => void
  hydrate: (repository: SheetsRepository, spreadsheetId: string) => Promise<void>
  refresh: (repository: SheetsRepository) => Promise<void>
  save: (repository: SheetsRepository) => Promise<void>
  mutateTab: (sheetName: SheetName, rows: string[][]) => void
}

export const useWorkbookStore = create<WorkbookState>((set, get) => ({
  tabs: {},
  sheetIds: {},
  dirty: false,
  status: 'idle',
  error: null,
  spreadsheetId: null,

  reset: () =>
    set({
      tabs: {},
      sheetIds: {},
      dirty: false,
      status: 'idle',
      error: null,
      spreadsheetId: null,
    }),

  hydrate: async (repository, spreadsheetId) => {
    set({ status: 'loading', error: null, spreadsheetId })
    try {
      const { tabs, sheetIds } = await loadAllTabs(repository, spreadsheetId)
      set({
        tabs,
        sheetIds,
        dirty: false,
        status: 'ready',
        error: null,
        spreadsheetId,
      })
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        spreadsheetId,
      })
    }
  },

  refresh: async (repository) => {
    const spreadsheetId = get().spreadsheetId
    if (!spreadsheetId) {
      throw new Error('No active spreadsheet')
    }
    set({ status: 'loading', error: null })
    try {
      const { tabs, sheetIds } = await loadAllTabs(repository, spreadsheetId)
      set({
        tabs,
        sheetIds,
        dirty: false,
        status: 'ready',
        error: null,
      })
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },

  save: async (repository) => {
    const spreadsheetId = get().spreadsheetId
    if (!spreadsheetId) {
      throw new Error('No active spreadsheet')
    }
    const { tabs } = get()
    for (const name of SHEET_NAMES) {
      const matrix = tabs[name] ?? emptySheetMatrix(name)
      await repository.replaceSheetMatrix(spreadsheetId, name, matrix)
    }
    set({ dirty: false })
  },

  mutateTab: (sheetName, rows) =>
    set((s) => ({
      tabs: { ...s.tabs, [sheetName]: rows },
      dirty: true,
    })),
}))

/** Entity rows derived from the in-memory workbook (tabs must be loaded). */
export function useSnapshotClients(): Client[] {
  return useWorkbookStore((s) => matrixToClients(s.tabs.clients))
}

export function useSnapshotJobs(): Job[] {
  return useWorkbookStore((s) => matrixToJobs(s.tabs.jobs))
}

export function useSnapshotPieces(): Piece[] {
  return useWorkbookStore((s) => matrixToPieces(s.tabs.pieces))
}

export function useSnapshotPieceItems(): PieceItem[] {
  return useWorkbookStore((s) => matrixToPieceItems(s.tabs.piece_items))
}

export function useSnapshotCrmNotes(): CrmNote[] {
  return useWorkbookStore((s) => matrixToCrmNotes(s.tabs.crm_notes))
}

export function useSnapshotTransactions(): Transaction[] {
  return useWorkbookStore((s) => matrixToTransactions(s.tabs.transactions))
}

export function useSnapshotExpenses(): Expense[] {
  return useWorkbookStore((s) => matrixToExpenses(s.tabs.expenses))
}

export function useSnapshotInventory(): Inventory[] {
  return useWorkbookStore((s) => matrixToInventory(s.tabs.inventory))
}

export function useSnapshotTags(): Tag[] {
  return useWorkbookStore((s) => matrixToTags(s.tabs.tags))
}

export function useSnapshotTagLinks(): TagLink[] {
  return useWorkbookStore((s) => matrixToTagLinks(s.tabs.tag_links))
}
