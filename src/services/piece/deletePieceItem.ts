import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieceItems } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function deletePieceItem(
  spreadsheetId: string,
  pieceItemId: string,
): Promise<void> {
  void spreadsheetId
  const items = matrixToPieceItems(useWorkbookStore.getState().tabs.piece_items)
  const existing = items.find((p) => p.id === pieceItemId)
  if (!existing) {
    throw new Error(`Piece item ${pieceItemId} not found`)
  }

  patchWorkbookTab('piece_items', (m) =>
    updateDataRowById('piece_items', m, pieceItemId, {
      deleted: 'true',
    }),
  )
}
