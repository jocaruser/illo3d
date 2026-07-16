import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Lot } from '@/Entity/Lot'
import type { PieceItem } from '@/Entity/PieceItem'
import { computeAvgUnitCost } from './avgUnitCost'

export const SUGGESTED_PRICE_MULTIPLIER = 3

export type SuggestedPriceResult =
  | { error: false; materialSubtotal: number; suggestedPrice: number }
  | { error: true; missingInventoryIds: string[] }

/**
 * Material subtotal for a single unit of a piece: Σ(line quantity × the
 * inventory item's average lot unit cost). Lines whose inventory item is
 * missing, has no computable average cost, or no quantity make the result
 * an error listing the offending inventory ids.
 */
export function computeSuggestedPrice(
  lines: PieceItem[],
  inventory: InventoryItem[],
  lots: Lot[],
): SuggestedPriceResult {
  const inventoryById = new Map(inventory.map((item) => [item.id, item]))
  const missing = new Set<string>()
  let materialSubtotal = 0

  for (const line of lines) {
    const item = inventoryById.get(line.inventoryId)
    if (!item) {
      missing.add(line.inventoryId)
      continue
    }
    const unitCost = computeAvgUnitCost(lots.filter((lot) => lot.inventoryId === item.id))
    if (unitCost === null || line.quantity === undefined) {
      missing.add(item.id)
      continue
    }
    materialSubtotal += line.quantity * unitCost
  }

  if (missing.size > 0) {
    return { error: true, missingInventoryIds: [...missing].sort() }
  }
  return {
    error: false,
    materialSubtotal,
    suggestedPrice: materialSubtotal * SUGGESTED_PRICE_MULTIPLIER,
  }
}
