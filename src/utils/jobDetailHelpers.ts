import type { Inventory, Piece, PieceItem, PieceStatus } from '@/types/money'
import { effectiveNeedByInventory, pieceUnitsAreSet } from './pieceEffectiveInventory'

export type PieceStatusFlow =
  | null
  | {
      piece: Piece
      nextStatus: PieceStatus
      mode: 'consume' | 'restore'
    }

export function isConsumingPieceStatus(s: PieceStatus): boolean {
  return s === 'done' || s === 'failed'
}

export function linesForPieceId(
  pieceItems: PieceItem[],
  pieceId: string
): PieceItem[] {
  return pieceItems.filter((pi) => pi.piece_id === pieceId)
}

export function stockShortfall(
  piece: Piece,
  lines: PieceItem[],
  inventoryRows: Inventory[]
): { id: string; need: number; have: number }[] {
  const needByLot = effectiveNeedByInventory(piece, lines)
  const inventoryById = new Map(inventoryRows.map((i) => [i.id, i]))
  const out: { id: string; need: number; have: number }[] = []
  for (const [id, need] of needByLot) {
    const row = inventoryById.get(id)
    const have = row?.qty_current ?? 0
    if (have < need) out.push({ id, need, have })
  }
  return out
}

export { pieceUnitsAreSet }
