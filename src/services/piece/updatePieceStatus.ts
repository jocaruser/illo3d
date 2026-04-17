import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToInventory,
  matrixToPieceItems,
  matrixToPieces,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { Inventory, Piece, PieceItem, PieceStatus } from '@/types/money'

export interface UpdatePieceStatusOptions {
  decrementInventory?: boolean
  restoreInventory?: boolean
}

export interface InsufficientStockLot {
  inventoryId: string
  need: number
  have: number
}

export type UpdatePieceStatusResult =
  | { ok: true }
  | { ok: false; reason: 'insufficient_stock'; lots: InsufficientStockLot[] }

function isConsuming(status: PieceStatus): boolean {
  return status === 'done' || status === 'failed'
}

function sheetRowFromPiece(piece: Piece): Record<string, unknown> {
  return {
    id: piece.id,
    job_id: piece.job_id,
    name: piece.name,
    status: piece.status,
    price: piece.price ?? '',
    created_at: piece.created_at,
    archived: piece.archived ?? '',
    deleted: piece.deleted ?? '',
  }
}

function sheetRowFromInventory(inv: Inventory): Record<string, unknown> {
  return {
    id: inv.id,
    type: inv.type,
    name: inv.name,
    qty_current: inv.qty_current,
    warn_yellow: inv.warn_yellow,
    warn_orange: inv.warn_orange,
    warn_red: inv.warn_red,
    created_at: inv.created_at,
    archived: inv.archived ?? '',
    deleted: inv.deleted ?? '',
  }
}

function parseQty(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

function normalizePieceItems(lines: PieceItem[]): PieceItem[] {
  return lines.map((line) => ({
    ...line,
    quantity: parseQty(line.quantity),
  }))
}

function aggregateNeedByInventory(lines: PieceItem[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const line of lines) {
    m.set(line.inventory_id, (m.get(line.inventory_id) ?? 0) + line.quantity)
  }
  return m
}

export async function updatePieceStatus(
  spreadsheetId: string,
  piece: Piece,
  newStatus: PieceStatus,
  options?: UpdatePieceStatusOptions
): Promise<UpdatePieceStatusResult> {
  void spreadsheetId
  const store = useWorkbookStore.getState()
  const pieces = matrixToPieces(store.tabs.pieces)
  const pIdx = pieces.findIndex((p) => p.id === piece.id)
  if (pIdx === -1) {
    throw new Error(`Piece ${piece.id} not found`)
  }

  const allItems = matrixToPieceItems(store.tabs.piece_items)
  const lines = normalizePieceItems(
    allItems.filter((item) => item.piece_id === piece.id && item.inventory_id),
  )

  const inventoryList = matrixToInventory(store.tabs.inventory)

  const oldStatus = piece.status

  const shouldDecrement =
    !isConsuming(oldStatus) &&
    isConsuming(newStatus) &&
    options?.decrementInventory === true

  const shouldRestore =
    isConsuming(oldStatus) &&
    !isConsuming(newStatus) &&
    options?.restoreInventory === true

  if (shouldDecrement && lines.length === 0) {
    throw new Error('Piece has no material lines to consume')
  }

  if (shouldDecrement) {
    const needByLot = aggregateNeedByInventory(lines)
    const insufficient: InsufficientStockLot[] = []
    for (const [inventoryId, need] of needByLot) {
      const inv = inventoryList.find((i) => i.id === inventoryId)
      const have = inv?.qty_current ?? 0
      if (have < need) {
        insufficient.push({ inventoryId, need, have })
      }
    }
    if (insufficient.length > 0) {
      return { ok: false, reason: 'insufficient_stock', lots: insufficient }
    }

    const working = new Map(inventoryList.map((i) => [i.id, { ...i }]))
    for (const [inventoryId, need] of needByLot) {
      const inv = working.get(inventoryId)
      if (!inv) continue
      inv.qty_current -= need
    }
    for (const inventoryId of needByLot.keys()) {
      const inv = working.get(inventoryId)
      if (!inv) continue
      patchWorkbookTab('inventory', (m) =>
        updateDataRowById('inventory', m, inventoryId, sheetRowFromInventory(inv)),
      )
    }
  }

  if (shouldRestore) {
    const needByLot = aggregateNeedByInventory(lines)
    const working = new Map(inventoryList.map((i) => [i.id, { ...i }]))
    for (const [inventoryId, add] of needByLot) {
      const inv = working.get(inventoryId)
      if (!inv) continue
      inv.qty_current += add
    }
    for (const inventoryId of needByLot.keys()) {
      const inv = working.get(inventoryId)
      if (!inv) continue
      patchWorkbookTab('inventory', (m) =>
        updateDataRowById('inventory', m, inventoryId, sheetRowFromInventory(inv)),
      )
    }
  }

  const nextPiece: Piece = { ...piece, status: newStatus }
  patchWorkbookTab('pieces', (m) =>
    updateDataRowById('pieces', m, piece.id, sheetRowFromPiece(nextPiece)),
  )

  return { ok: true }
}
