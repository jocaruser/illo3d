import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Job } from '@/Entity/Job'
import type { Lot } from '@/Entity/Lot'
import type { Piece } from '@/Entity/Piece'
import type { PieceItem } from '@/Entity/PieceItem'
import { expectedBenefit } from '@/Service/Pricing/expectedBenefit'
import { computeSuggestedPrice } from '@/Service/Pricing/suggestedPrice'

/**
 * True when `expectedBenefit` would count this piece: priced, with at least
 * one active material line, and every line costable from its lots.
 */
function pieceQualifies(
  piece: Piece,
  job: Job,
  pieceItems: PieceItem[],
  inventory: InventoryItem[],
  lots: Lot[],
): boolean {
  if (piece.jobId !== job.id || piece.isDeleted() || !piece.isPriced()) return false
  const lines = pieceItems.filter((line) => line.pieceId === piece.id && line.isActive())
  if (lines.length === 0) return false
  return !computeSuggestedPrice(lines, inventory, lots).error
}

/**
 * One job's expected benefit, or null when nothing about it is computable —
 * which is what lets a card show "(€12.00)" only when the figure means
 * something, instead of a misleading €0.00.
 */
export function jobBenefit(
  job: Job,
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventory: InventoryItem[],
  lots: Lot[],
): number | null {
  if (!job.isActive() || !job.isOpen()) return null
  const qualifies = pieces.some((piece) => pieceQualifies(piece, job, pieceItems, inventory, lots))
  if (!qualifies) return null
  return expectedBenefit([job], pieces, pieceItems, inventory, lots)
}
