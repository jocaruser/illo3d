import type { Inventory, Lot, Piece, PieceItem } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { pieceUnitsResolved } from '@/utils/pieceEffectiveInventory'

function isActiveItem(item: PieceItem): boolean {
  return String(item.archived).toLowerCase() !== 'true' && String(item.deleted).toLowerCase() !== 'true'
}

/** Sum of piece_item.quantity × piece.units × avg_unit_cost for all active piece items of a job. */
export function jobMaterialCost(
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
  lots: Lot[],
): number {
  const pieceById = new Map(pieces.map((p) => [p.id, p]))
  let total = 0
  for (const item of pieceItems) {
    if (!isActiveItem(item)) continue
    const piece = pieceById.get(item.piece_id)
    if (!piece) continue
    const units = pieceUnitsResolved(piece)
    if (units == null) continue
    const inv = inventoryRows.find((i) => i.id === item.inventory_id)
    if (!inv) continue
    const invLots = lots.filter(
      (l) => l.inventory_id === inv.id && String(l.archived).toLowerCase() !== 'true' && String(l.deleted).toLowerCase() !== 'true',
    )
    const unit = computeAvgUnitCost(invLots)
    if (unit == null) continue
    const qty =
      typeof item.quantity === 'number' ? item.quantity : Number(item.quantity)
    if (!Number.isFinite(qty)) continue
    total += qty * units * unit
  }
  return total
}
