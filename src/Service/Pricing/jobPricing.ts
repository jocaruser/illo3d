import type { Piece } from '@/Entity/Piece'

export type JobPricingState = { complete: true; total: number } | { complete: false }

/**
 * A job's pricing is complete when it has at least one counting piece
 * (non-deleted, archived included) and every counting piece is priced.
 */
export function jobPricingState(countingPieces: Piece[]): JobPricingState {
  if (countingPieces.length === 0) return { complete: false }
  let total = 0
  for (const piece of countingPieces) {
    const lineTotal = piece.lineTotal()
    if (lineTotal === undefined) return { complete: false }
    total += lineTotal
  }
  return { complete: true, total }
}
