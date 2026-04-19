import type { Inventory, Job, Lot, Piece, PieceItem } from '@/types/money'
import { countingPiecesForJob, piecePriceIsSet } from '@/utils/jobPiecePricing'
import { computePieceSuggestedPrice } from '@/utils/jobSuggestedPrice'
import { pieceUnitsResolved } from '@/utils/pieceEffectiveInventory'

function isActiveJob(j: Job): boolean {
  return j.archived !== 'true' && j.deleted !== 'true'
}

function isDraftOrInProgress(status: Job['status']): boolean {
  return status === 'draft' || status === 'in_progress'
}

/**
 * Sums expected benefit (line revenue minus material at avg lot cost) for
 * counting pieces on draft / in-progress jobs where units, price, and BOM costs are computable.
 */
export function dashboardExpectedBenefitTotal(
  jobs: Job[],
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventory: Inventory[],
  lots: Lot[],
): number {
  let sum = 0
  for (const job of jobs) {
    if (!isActiveJob(job) || !isDraftOrInProgress(job.status)) continue
    const list = countingPiecesForJob(job.id, pieces)
    for (const piece of list) {
      const units = pieceUnitsResolved(piece)
      if (units == null || !piecePriceIsSet(piece)) continue
      const sug = computePieceSuggestedPrice(
        piece.id,
        pieceItems,
        inventory,
        lots,
      )
      if (sug.kind !== 'ok') continue
      const revenue = units * (piece.price as number)
      const materialRun = sug.materialSubtotal * units
      sum += revenue - materialRun
    }
  }
  return sum
}

export function dashboardExpectedBenefitHasQualifyingPiece(
  jobs: Job[],
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventory: Inventory[],
  lots: Lot[],
): boolean {
  for (const job of jobs) {
    if (!isActiveJob(job) || !isDraftOrInProgress(job.status)) continue
    const list = countingPiecesForJob(job.id, pieces)
    for (const piece of list) {
      const units = pieceUnitsResolved(piece)
      if (units == null || !piecePriceIsSet(piece)) continue
      const sug = computePieceSuggestedPrice(
        piece.id,
        pieceItems,
        inventory,
        lots,
      )
      if (sug.kind === 'ok') return true
    }
  }
  return false
}
