import type { Inventory, Piece, PieceItem } from '@/types/money'
import { pieceUnitsResolved } from '@/utils/pieceEffectiveInventory'
import { jobMinimumRedos } from '@/utils/jobRedos'

function isActiveItem(item: PieceItem): boolean {
  return item.archived !== 'true' && item.deleted !== 'true'
}

/** Compute the overall risk factor for a job (minimum redos across filament items). */
export function jobOverallRiskFactor(
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
): { minRedos: number; inventoryName: string } | null {
  const pieceById = new Map(pieces.map((p) => [p.id, p]))
  const filamentQuantities = new Map<string, number>()

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

    const effectiveQty = qty * units
    filamentQuantities.set(
      item.inventory_id,
      (filamentQuantities.get(item.inventory_id) ?? 0) + effectiveQty,
    )
  }

  return jobMinimumRedos(inventoryRows, filamentQuantities)
}
