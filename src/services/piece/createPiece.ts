import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToPieces } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface CreatePiecePayload {
  job_id: string
  name: string
  price?: number
}

export async function createPiece(
  spreadsheetId: string,
  payload: CreatePiecePayload
): Promise<void> {
  void spreadsheetId
  const existing = matrixToPieces(useWorkbookStore.getState().tabs.pieces)
  const pieceId = nextNumericId(
    'P',
    existing.map((p) => p.id).filter((id): id is string => id != null),
  )
  const createdAt = new Date().toISOString()

  const priceCell =
    payload.price !== undefined && payload.price !== null
      ? payload.price
      : ''

  patchWorkbookTab('pieces', (m) =>
    appendDataRow('pieces', m, {
      id: pieceId,
      job_id: payload.job_id,
      name: payload.name.trim(),
      status: 'pending',
      price: priceCell,
      units: '',
      created_at: createdAt,
      archived: '',
      deleted: '',
    }),
  )
}
