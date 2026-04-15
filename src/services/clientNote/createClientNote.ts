import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { SheetName } from '@/services/sheets/config'
import { assertClientNoteSeverity } from './severity'

export interface CreateClientNotePayload {
  client_id: string
  body: string
  severity: string
}

export async function createClientNote(
  spreadsheetId: string,
  payload: CreateClientNotePayload
): Promise<void> {
  const repo = getSheetsRepository()
  const existing = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'client_notes' as SheetName
  )
  const noteId = nextNumericId(
    'CN',
    existing.map((r) => r.id).filter((id): id is string => id != null)
  )
  const severity = assertClientNoteSeverity(payload.severity)
  const createdAt = new Date().toISOString()
  await repo.appendRows(spreadsheetId, 'client_notes' as SheetName, [
    {
      id: noteId,
      client_id: payload.client_id.trim(),
      body: payload.body.trim(),
      severity,
      created_at: createdAt,
    },
  ])
}
