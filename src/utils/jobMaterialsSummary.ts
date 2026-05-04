import type { Inventory, Lot, Piece, PieceItem } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { computeRedos } from '@/utils/jobRedos'
import { pieceUnitsResolved } from '@/utils/pieceEffectiveInventory'

export interface MaterialsSummaryRow {
  inventoryId: string
  inventoryName: string
  inventoryType: string
  totalQuantity: number
  estimatedCost: number | null
  redos: number | null
  remainingQty: number | null
  usedInPieces: string[]
}

function isActive(row: { archived?: string; deleted?: string }): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

/** Build aggregated materials summary rows for a job. */
export function buildMaterialsSummary(
  jobId: string,
  pieces: Piece[],
  pieceItems: PieceItem[],
  inventoryRows: Inventory[],
  lots: Lot[],
): MaterialsSummaryRow[] {
  const jobPieces = pieces.filter(
    (p) => p.job_id === jobId && isActive(p),
  )
  const pieceById = new Map(jobPieces.map((p) => [p.id, p]))

  const aggregates = new Map<
    string,
    {
      totalQuantity: number
      pieceNames: Set<string>
    }
  >()

  for (const item of pieceItems) {
    if (!isActive(item)) continue
    const piece = pieceById.get(item.piece_id)
    if (!piece) continue
    const units = pieceUnitsResolved(piece)
    if (units == null) continue

    const effectiveQty = item.quantity * units

    const existing = aggregates.get(item.inventory_id)
    if (existing) {
      existing.totalQuantity += effectiveQty
      existing.pieceNames.add(piece.name)
    } else {
      aggregates.set(item.inventory_id, {
        totalQuantity: effectiveQty,
        pieceNames: new Set([piece.name]),
      })
    }
  }

  const rows: MaterialsSummaryRow[] = []
  for (const [inventoryId, agg] of aggregates) {
    const inv = inventoryRows.find((i) => i.id === inventoryId)
    if (!inv) continue

    const invLots = lots.filter(
      (l) =>
        l.inventory_id === inv.id && l.archived !== 'true' && l.deleted !== 'true',
    )
    const avgCost = computeAvgUnitCost(invLots)
    const estimatedCost =
      avgCost == null ? null : agg.totalQuantity * avgCost

    const { redos } =
      inv.type === 'filament' ? computeRedos(inv, agg.totalQuantity) : { redos: null }

    rows.push({
      inventoryId,
      inventoryName: inv.name,
      inventoryType: inv.type,
      totalQuantity: agg.totalQuantity,
      estimatedCost,
      redos,
      remainingQty: inv.qty_current != null ? inv.qty_current - agg.totalQuantity : null,
      usedInPieces: Array.from(agg.pieceNames),
    })
  }

  const typeOrder: Record<string, number> = { filament: 0, consumable: 1, equipment: 2 }
  rows.sort((a, b) => {
    const typeDiff =
      (typeOrder[a.inventoryType] ?? 99) - (typeOrder[b.inventoryType] ?? 99)
    if (typeDiff !== 0) return typeDiff
    return a.inventoryName.localeCompare(b.inventoryName)
  })

  return rows
}
