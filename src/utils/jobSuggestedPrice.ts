import type { Expense, Inventory, Piece, PieceItem } from '@/types/money'

export const JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER = 3

export type JobSuggestedPriceMissingLot = { id: string; name: string }

export type JobSuggestedPriceResult =
  | { kind: 'hidden' }
  | { kind: 'ok'; materialSubtotal: number; suggestedPrice: number }
  | { kind: 'error'; lots: JobSuggestedPriceMissingLot[] }

function lotLabel(inventoryId: string, inv: Inventory | undefined) {
  return {
    id: inventoryId,
    name: inv?.name ?? inventoryId,
  }
}

export function computeJobSuggestedPrice(
  jobId: string,
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
  expenses: Expense[]
): JobSuggestedPriceResult {
  const jobPieces = pieces.filter((p) => p.job_id === jobId)
  if (jobPieces.length === 0) {
    return { kind: 'hidden' }
  }

  const pieceIds = new Set(jobPieces.map((p) => p.id))
  const lines = pieceItems.filter((pi) => pieceIds.has(pi.piece_id))
  if (lines.length === 0) {
    return { kind: 'hidden' }
  }

  const invById = new Map(inventoryRows.map((i) => [i.id, i]))
  const expById = new Map(expenses.map((e) => [e.id, e]))

  const missing = new Map<string, JobSuggestedPriceMissingLot>()
  let materialSubtotal = 0

  for (const line of lines) {
    const inv = invById.get(line.inventory_id)
    if (!inv) {
      missing.set(line.inventory_id, lotLabel(line.inventory_id, undefined))
      continue
    }

    if (!Number.isFinite(inv.qty_initial) || inv.qty_initial <= 0) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

    const expense = expById.get(inv.expense_id)
    if (!expense) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

    if (!Number.isFinite(expense.amount)) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

    const qty =
      typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
    if (!Number.isFinite(qty)) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

    const unitCost = expense.amount / inv.qty_initial
    materialSubtotal += qty * unitCost
  }

  if (missing.size > 0) {
    const lots = [...missing.values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    )
    return { kind: 'error', lots }
  }

  const suggestedPrice =
    materialSubtotal * JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER

  return {
    kind: 'ok',
    materialSubtotal,
    suggestedPrice,
  }
}
