import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieces } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function updatePieceBoardOrder(
  spreadsheetId: string,
  pieceId: string,
  boardOrder: number | undefined,
): Promise<void> {
  void spreadsheetId
  const pieces = matrixToPieces(useWorkbookStore.getState().tabs.pieces)
  const existing = pieces.find((p) => p.id === pieceId)
  if (!existing) {
    throw new Error(`Piece ${pieceId} not found`)
  }
  const row: Record<string, unknown> = {
    id: existing.id,
    job_id: existing.job_id,
    name: existing.name,
    status: existing.status,
    price: existing.price ?? '',
    units: existing.units ?? '',
    board_order: boardOrder ?? '',
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('pieces', (m) =>
    updateDataRowById('pieces', m, pieceId, row),
  )
}
