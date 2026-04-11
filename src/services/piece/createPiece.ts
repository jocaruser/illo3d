import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { SheetName } from '@/services/sheets/config'

export interface CreatePiecePayload {
  job_id: string
  name: string
}

export async function createPiece(
  spreadsheetId: string,
  payload: CreatePiecePayload
): Promise<void> {
  const repo = getSheetsRepository()
  const existing = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'pieces' as SheetName
  )
  const pieceId = nextNumericId(
    'P',
    existing.map((p) => p.id).filter((id): id is string => id != null)
  )
  const createdAt = new Date().toISOString()

  await repo.appendRows(spreadsheetId, 'pieces' as SheetName, [
    {
      id: pieceId,
      job_id: payload.job_id,
      name: payload.name.trim(),
      status: 'pending',
      created_at: createdAt,
    },
  ])
}
