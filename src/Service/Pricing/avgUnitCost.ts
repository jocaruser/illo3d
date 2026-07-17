import type { Lot } from '@/Entity/Lot'

/**
 * Weighted average unit cost over active lots (Σ amount / Σ quantity).
 * Lots without a positive quantity or without an amount are excluded;
 * null when nothing qualifies.
 */
export function computeAvgUnitCost(lots: Lot[]): number | null {
  let sumQuantity = 0
  let sumAmount = 0
  for (const lot of lots) {
    if (!lot.isActive()) continue
    if (lot.quantity === undefined || lot.quantity <= 0) continue
    if (lot.amount === undefined) continue
    sumQuantity += lot.quantity
    sumAmount += lot.amount
  }
  if (sumQuantity <= 0) return null
  return sumAmount / sumQuantity
}
