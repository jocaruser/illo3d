import type { Inventory, Piece, PieceItem } from '@/types/money'
import { pieceUnitsResolved } from '@/utils/pieceEffectiveInventory'

function isActiveItem(item: PieceItem): boolean {
  return item.archived !== 'true' && item.deleted !== 'true'
}

/** Sum of piece_item.quantity × piece.units for filament-type inventories. */
export function jobFilamentGrams(
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
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
    if (!inv || inv.type !== 'filament') continue
    const qty =
      typeof item.quantity === 'number' ? item.quantity : Number(item.quantity)
    if (!Number.isFinite(qty)) continue
    total += qty * units
  }
  return total
}
