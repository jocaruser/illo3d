import { getSheetsRepository } from '@/services/sheets/repository'
import type { ClientNote } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'
import { assertClientNoteSeverity } from './severity'

export interface UpdateClientNotePayload {
  body: string
  severity: string
}

export async function updateClientNote(
  spreadsheetId: string,
  noteId: string,
  payload: UpdateClientNotePayload
): Promise<void> {
  const repo = getSheetsRepository()
  const notes = await repo.readRows<ClientNote>(
    spreadsheetId,
    'client_notes' as SheetName
  )
  const matches = notes.reduce<number[]>((acc, n, i) => {
    if (n.id === noteId) acc.push(i)
    return acc
  }, [])
  const idx = matches.length ? matches[matches.length - 1] : -1
  if (idx === -1) {
    throw new Error(`Client note ${noteId} not found`)
  }
  const existing = notes[idx]
  const severity = assertClientNoteSeverity(payload.severity)
  const row = {
    id: existing.id,
    client_id: existing.client_id,
    body: payload.body.trim(),
    severity,
    created_at: existing.created_at,
  }
  await repo.updateRow(
    spreadsheetId,
    'client_notes' as SheetName,
    idx + 1,
    row
  )
}
