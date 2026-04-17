import type { Inventory, Lot, PieceItem } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'

/** Quantity × weighted avg unit cost from lots for that inventory, or null if missing. */
export function materialCostForPieceItemLine(
  line: PieceItem,
  inventoryRows: Inventory[],
  lots: Lot[],
): number | null {
  const inv = inventoryRows.find((i) => i.id === line.inventory_id)
  if (!inv) return null
  const invLots = lots.filter((l) => l.inventory_id === inv.id)
  const unit = computeAvgUnitCost(invLots)
  if (unit == null) return null
  const qty =
    typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
  if (!Number.isFinite(qty)) return null
  return qty * unit
}
