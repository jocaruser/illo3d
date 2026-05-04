import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieces } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function updatePieceName(
  spreadsheetId: string,
  pieceId: string,
  name: string,
): Promise<void> {
  void spreadsheetId
  const pieces = matrixToPieces(useWorkbookStore.getState().tabs.pieces)
  const existing = pieces.find((p) => p.id === pieceId)
  if (!existing) {
    throw new Error(`Piece ${pieceId} not found`)
  }

  patchWorkbookTab('pieces', (m) =>
    updateDataRowById('pieces', m, pieceId, {
      name: name.trim(),
    }),
  )
}
