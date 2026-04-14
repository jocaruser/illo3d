import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { SheetName } from '@/services/sheets/config'

export interface CreatePieceItemPayload {
  piece_id: string
  inventory_id: string
  quantity: number
}

export async function createPieceItem(
  spreadsheetId: string,
  payload: CreatePieceItemPayload
): Promise<void> {
  const repo = getSheetsRepository()
  const existing = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'piece_items' as SheetName
  )
  const lineId = nextNumericId(
    'PI',
    existing.map((r) => r.id).filter((id): id is string => id != null)
  )

  await repo.appendRows(spreadsheetId, 'piece_items' as SheetName, [
    {
      id: lineId,
      piece_id: payload.piece_id,
      inventory_id: payload.inventory_id,
      quantity: payload.quantity,
    },
  ])
}
