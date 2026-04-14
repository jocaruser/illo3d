import { getSheetsRepository } from '@/services/sheets/repository'
import type { Inventory, Piece, PieceItem, PieceStatus } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'

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
    created_at: piece.created_at,
  }
}

function sheetRowFromInventory(inv: Inventory): Record<string, unknown> {
  return {
    id: inv.id,
    expense_id: inv.expense_id,
    type: inv.type,
    name: inv.name,
    qty_initial: inv.qty_initial,
    qty_current: inv.qty_current,
    created_at: inv.created_at,
  }
}

function parseQty(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

function normalizeInventoryRows(rows: Inventory[]): Inventory[] {
  return rows.map((r) => ({
    ...r,
    qty_initial: parseQty(r.qty_initial),
    qty_current: parseQty(r.qty_current),
  }))
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
  const repo = getSheetsRepository()
  const pieces = await repo.readRows<Piece>(
    spreadsheetId,
    'pieces' as SheetName
  )
  const pIdx = pieces.findIndex((p) => p.id === piece.id)
  if (pIdx === -1) {
    throw new Error(`Piece ${piece.id} not found`)
  }

  const allItems = await repo.readRows<PieceItem>(
    spreadsheetId,
    'piece_items' as SheetName
  )
  const lines = normalizePieceItems(
    allItems.filter((item) => item.piece_id === piece.id && item.inventory_id)
  )

  const inventoryList = normalizeInventoryRows(
    await repo.readRows<Inventory>(spreadsheetId, 'inventory' as SheetName)
  )

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
      const idx = inventoryList.findIndex((i) => i.id === inventoryId)
      await repo.updateRow(
        spreadsheetId,
        'inventory' as SheetName,
        idx + 1,
        sheetRowFromInventory(inv)
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
      const idx = inventoryList.findIndex((i) => i.id === inventoryId)
      await repo.updateRow(
        spreadsheetId,
        'inventory' as SheetName,
        idx + 1,
        sheetRowFromInventory(inv)
      )
    }
  }

  const nextPiece: Piece = { ...piece, status: newStatus }
  await repo.updateRow(
    spreadsheetId,
    'pieces' as SheetName,
    pIdx + 1,
    sheetRowFromPiece(nextPiece)
  )

  return { ok: true }
}
