import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Job } from '@/Entity/Job'
import type { Lot } from '@/Entity/Lot'
import type { Piece } from '@/Entity/Piece'
import type { PieceItem } from '@/Entity/PieceItem'
import { computeSuggestedPrice } from './suggestedPrice'

/**
 * Expected benefit across open (draft / in-progress) active jobs: for every
 * qualifying counting piece — priced, with at least one active material line,
 * all lines computable — units × price minus units × material cost at the
 * average lot unit cost.
 */
export function expectedBenefit(
  jobs: Job[],
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventory: InventoryItem[],
  lots: Lot[],
): number {
  let total = 0
  for (const job of jobs) {
    if (!job.isActive() || !job.isOpen()) continue
    for (const piece of pieces) {
      if (piece.jobId !== job.id || piece.isDeleted()) continue
      if (!piece.isPriced()) continue
      const lines = pieceItems.filter((line) => line.pieceId === piece.id && line.isActive())
      if (lines.length === 0) continue
      const suggested = computeSuggestedPrice(lines, inventory, lots)
      if (suggested.error) continue
      const units = piece.units as number
      total += units * (piece.price as number) - units * suggested.materialSubtotal
    }
  }
  return total
}
