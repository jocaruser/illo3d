import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieces } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface KanbanDropResult {
  pieceId: string
  newStatus: string
  newBoardOrder: number
}

export async function applyPieceKanbanDrop(
  spreadsheetId: string,
  pieceId: string,
  newStatus: string,
  targetBoardOrder: number,
): Promise<KanbanDropResult> {
  void spreadsheetId
  const pieces = matrixToPieces(useWorkbookStore.getState().tabs.pieces)
  const piece = pieces.find((p) => p.id === pieceId)
  if (!piece) {
    throw new Error(`Piece ${pieceId} not found`)
  }

  // Reorder other pieces in the target status to make room
  const sameStatusPieces = pieces
    .filter((p) => p.status === newStatus && p.id !== pieceId)
    .sort((a, b) => (a.board_order ?? 0) - (b.board_order ?? 0))

  // Shift pieces at or after target position
  for (let i = 0; i < sameStatusPieces.length; i++) {
    const p = sameStatusPieces[i]
    const currentOrder = p.board_order ?? i
    if (currentOrder >= targetBoardOrder) {
      const row: Record<string, unknown> = {
        id: p.id,
        job_id: p.job_id,
        name: p.name,
        status: p.status,
        price: p.price ?? '',
        units: p.units ?? '',
        board_order: currentOrder + 1,
        created_at: p.created_at,
        archived: p.archived ?? '',
        deleted: p.deleted ?? '',
      }
      patchWorkbookTab('pieces', (m) =>
        updateDataRowById('pieces', m, p.id, row),
      )
    }
  }

  // Update the dropped piece
  const updatedPiece: Record<string, unknown> = {
    id: piece.id,
    job_id: piece.job_id,
    name: piece.name,
    status: newStatus,
    price: piece.price ?? '',
    units: piece.units ?? '',
    board_order: targetBoardOrder,
    created_at: piece.created_at,
    archived: piece.archived ?? '',
    deleted: piece.deleted ?? '',
  }

  patchWorkbookTab('pieces', (m) =>
    updateDataRowById('pieces', m, pieceId, updatedPiece),
  )

  return {
    pieceId,
    newStatus,
    newBoardOrder: targetBoardOrder,
  }
}
