import type { Lot } from '@/types/money'

function isActiveLot(l: Lot): boolean {
  return l.archived !== 'true' && l.deleted !== 'true'
}

/** Weighted average unit cost from lots (Σ amount / Σ quantity). Excludes qty ≤ 0 and inactive lots. */
export function computeAvgUnitCost(lots: Lot[]): number | null {
  let sumQty = 0
  let sumAmt = 0
  for (const l of lots) {
    if (!isActiveLot(l)) continue
    const q =
      typeof l.quantity === 'number' ? l.quantity : Number(l.quantity)
    const a = typeof l.amount === 'number' ? l.amount : Number(l.amount)
    if (!Number.isFinite(q) || q <= 0) continue
    if (!Number.isFinite(a)) continue
    sumQty += q
    sumAmt += a
  }
  if (sumQty <= 0) return null
  return sumAmt / sumQty
}
