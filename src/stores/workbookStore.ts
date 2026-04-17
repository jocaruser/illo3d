import { useMemo } from 'react'
import { create } from 'zustand'
import { SHEET_NAMES, type SheetName } from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import { emptySheetMatrix } from '@/services/sheets/sheetMatrix'
import type {
  Client,
  CrmNote,
  Inventory,
  Job,
  Lot,
  Piece,
  PieceItem,
  Tag,
  TagLink,
  Transaction,
} from '@/types/money'
import {
  matrixToClients,
  matrixToCrmNotes,
  matrixToLots,
  matrixToInventory,
  matrixToJobs,
  matrixToPieceItems,
  matrixToPieces,
  matrixToTagLinks,
  matrixToTags,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { applyPiecePricingMigrations } from '@/lib/workbook/migratePiecePricing'

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
      const { tabs: migrated, modified } = applyPiecePricingMigrations(tabs)
      set({
        tabs: migrated,
        sheetIds,
        dirty: modified,
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
      const { tabs: migrated, modified } = applyPiecePricingMigrations(tabs)
      set({
        tabs: migrated,
        sheetIds,
        dirty: modified,
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
  const matrix = useWorkbookStore((s) => s.tabs.clients)
  return useMemo(() => matrixToClients(matrix), [matrix])
}

export function useSnapshotJobs(): Job[] {
  const matrix = useWorkbookStore((s) => s.tabs.jobs)
  return useMemo(() => matrixToJobs(matrix), [matrix])
}

export function useSnapshotPieces(): Piece[] {
  const matrix = useWorkbookStore((s) => s.tabs.pieces)
  return useMemo(() => matrixToPieces(matrix), [matrix])
}

export function useSnapshotPieceItems(): PieceItem[] {
  const matrix = useWorkbookStore((s) => s.tabs.piece_items)
  return useMemo(() => matrixToPieceItems(matrix), [matrix])
}

export function useSnapshotCrmNotes(): CrmNote[] {
  const matrix = useWorkbookStore((s) => s.tabs.crm_notes)
  return useMemo(() => matrixToCrmNotes(matrix), [matrix])
}

export function useSnapshotTransactions(): Transaction[] {
  const matrix = useWorkbookStore((s) => s.tabs.transactions)
  return useMemo(() => matrixToTransactions(matrix), [matrix])
}

export function useSnapshotLots(): Lot[] {
  const matrix = useWorkbookStore((s) => s.tabs.lots)
  return useMemo(() => matrixToLots(matrix), [matrix])
}

export function useSnapshotInventory(): Inventory[] {
  const matrix = useWorkbookStore((s) => s.tabs.inventory)
  return useMemo(() => matrixToInventory(matrix), [matrix])
}

export function useSnapshotTags(): Tag[] {
  const matrix = useWorkbookStore((s) => s.tabs.tags)
  return useMemo(() => matrixToTags(matrix), [matrix])
}

export function useSnapshotTagLinks(): TagLink[] {
  const matrix = useWorkbookStore((s) => s.tabs.tag_links)
  return useMemo(() => matrixToTagLinks(matrix), [matrix])
}
