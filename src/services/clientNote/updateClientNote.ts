import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'
import { assertClientNoteSeverity } from './severity'
import {
  formatReferencedEntityIdsCell,
  parseMentionEntityIdsFromText,
} from '@/utils/mentionTokens'

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
  const notes = await repo.readRows<Record<string, string>>(
    spreadsheetId,
    'crm_notes' as SheetName
  )
  const matches = notes.reduce<number[]>((acc, n, i) => {
    if (n.id?.trim() === noteId) acc.push(i)
    return acc
  }, [])
  const idx = matches.length ? matches[matches.length - 1] : -1
  if (idx === -1) {
    throw new Error(`Client note ${noteId} not found`)
  }
  const existing = notes[idx]
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body)
  )
  const row = {
    id: existing.id?.trim() ?? '',
    entity_type: existing.entity_type?.trim() ?? 'client',
    entity_id: existing.entity_id?.trim() ?? '',
    body,
    referenced_entity_ids,
    severity,
    created_at: existing.created_at?.trim() ?? '',
  }
  await repo.updateRow(
    spreadsheetId,
    'crm_notes' as SheetName,
    idx + 1,
    row
  )
}
