import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieceItems } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface CreatePieceItemPayload {
  piece_id: string
  inventory_id: string
  quantity: number
}

export const DUPLICATE_PIECE_ITEM_INVENTORY = 'DUPLICATE_PIECE_ITEM_INVENTORY'

export async function createPieceItem(
  spreadsheetId: string,
  payload: CreatePieceItemPayload
): Promise<void> {
  void spreadsheetId
  const existing = matrixToPieceItems(
    useWorkbookStore.getState().tabs.piece_items,
  )
  const duplicate = existing.some(
    (r) =>
      r.piece_id === payload.piece_id &&
      r.inventory_id === payload.inventory_id &&
      r.archived !== 'true' &&
      r.deleted !== 'true',
  )
  if (duplicate) {
    throw new Error(DUPLICATE_PIECE_ITEM_INVENTORY)
  }
  const lineId = nextNumericId(
    'PI',
    existing.map((r) => r.id).filter((id): id is string => id != null),
  )

  patchWorkbookTab('piece_items', (m) =>
    appendDataRow('piece_items', m, {
      id: lineId,
      piece_id: payload.piece_id,
      inventory_id: payload.inventory_id,
      quantity: payload.quantity,
      archived: '',
      deleted: '',
    }),
  )
}
