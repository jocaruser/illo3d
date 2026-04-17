import type { Job, Piece, PieceItem } from '@/types/money'

export interface InventoryConsumptionRow {
  pieceItemId: string
  pieceId: string
  pieceName: string
  jobId: string
  jobDescription: string
  quantity: number
  pieceCreatedAt: string
}

function isActiveRow(archived?: string, deleted?: string): boolean {
  return archived !== 'true' && deleted !== 'true'
}

export function buildInventoryConsumptionRows(
  inventoryId: string,
  pieceItems: PieceItem[],
  pieces: Piece[],
  jobs: Job[]
): InventoryConsumptionRow[] {
  const activePieces = pieces.filter((p) => isActiveRow(p.archived, p.deleted))
  const pieceById = new Map(activePieces.map((p) => [p.id, p]))
  const jobById = new Map(
    jobs.filter((j) => isActiveRow(j.archived, j.deleted)).map((j) => [j.id, j])
  )

  const rows: InventoryConsumptionRow[] = []
  for (const pi of pieceItems) {
    if (!isActiveRow(pi.archived, pi.deleted)) continue
    if (pi.inventory_id !== inventoryId) continue
    const piece = pieceById.get(pi.piece_id)
    if (!piece) continue
    const job = jobById.get(piece.job_id)
    rows.push({
      pieceItemId: pi.id,
      pieceId: piece.id,
      pieceName: piece.name,
      jobId: piece.job_id,
      jobDescription: job?.description?.trim()
        ? job.description.trim()
        : piece.job_id,
      quantity: pi.quantity,
      pieceCreatedAt: piece.created_at,
    })
  }

  return rows.sort((a, b) => b.pieceCreatedAt.localeCompare(a.pieceCreatedAt))
}
