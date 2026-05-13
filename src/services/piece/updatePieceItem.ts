import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieceItems } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export const DUPLICATE_PIECE_ITEM_INVENTORY = 'DUPLICATE_PIECE_ITEM_INVENTORY'

export async function updatePieceItem(
  spreadsheetId: string,
  pieceItemId: string,
  updates: {
    quantity?: number
    inventory_id?: string
  }
): Promise<void> {
  void spreadsheetId
  const items = matrixToPieceItems(useWorkbookStore.getState().tabs.piece_items)
  const existing = items.find((p) => p.id === pieceItemId)
  if (!existing) {
    throw new Error(`Piece item ${pieceItemId} not found`)
  }

  if (updates.inventory_id !== undefined && updates.inventory_id !== existing.inventory_id) {
    const duplicate = items.some(
      (r) =>
        r.id !== pieceItemId &&
        r.piece_id === existing.piece_id &&
        r.inventory_id === updates.inventory_id &&
        String(r.archived).toLowerCase() !== 'true' &&
        String(r.deleted).toLowerCase() !== 'true',
    )
    if (duplicate) {
      throw new Error(DUPLICATE_PIECE_ITEM_INVENTORY)
    }
  }

  patchWorkbookTab('piece_items', (m) =>
    updateDataRowById('piece_items', m, pieceItemId, {
      quantity: updates.quantity === undefined ? existing.quantity : updates.quantity,
      inventory_id: updates.inventory_id === undefined ? existing.inventory_id : updates.inventory_id,
    }),
  )
}
