import type { Inventory, Lot, PieceItem } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'

export const JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER = 3

export type PieceSuggestedPriceMissingLot = { id: string; name: string }

export type PieceSuggestedPriceResult =
  | { kind: 'hidden' }
  | { kind: 'ok'; materialSubtotal: number; suggestedPrice: number }
  | { kind: 'error'; lots: PieceSuggestedPriceMissingLot[] }

function lotLabel(inventoryId: string, inv: Inventory | undefined) {
  return {
    id: inventoryId,
    name: inv?.name ?? inventoryId,
  }
}

export function computePieceSuggestedPrice(
  pieceId: string,
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
  lots: Lot[]
): PieceSuggestedPriceResult {
  const lines = pieceItems.filter((pi) => pi.piece_id === pieceId)
  if (lines.length === 0) {
    return { kind: 'hidden' }
  }

  const invById = new Map(inventoryRows.map((i) => [i.id, i]))

  const missing = new Map<string, PieceSuggestedPriceMissingLot>()
  let materialSubtotal = 0

  for (const line of lines) {
    const inv = invById.get(line.inventory_id)
    if (!inv) {
      missing.set(line.inventory_id, lotLabel(line.inventory_id, undefined))
      continue
    }

    const invLots = lots.filter((l) => l.inventory_id === inv.id)
    const unitCost = computeAvgUnitCost(invLots)
    if (unitCost == null) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

    const qty =
      typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
    if (!Number.isFinite(qty)) {
      missing.set(inv.id, lotLabel(inv.id, inv))
      continue
    }

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
