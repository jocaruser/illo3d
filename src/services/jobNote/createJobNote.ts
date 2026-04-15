import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { SheetName } from '@/services/sheets/config'
import { assertClientNoteSeverity } from '@/services/clientNote/severity'
import {
  formatReferencedEntityIdsCell,
  parseMentionEntityIdsFromText,
} from '@/utils/mentionTokens'

export interface CreateJobNotePayload {
  job_id: string
  body: string
  severity: string
}

export async function createJobNote(
  spreadsheetId: string,
  payload: CreateJobNotePayload,
): Promise<void> {
  const repo = getSheetsRepository()
  const existing = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'crm_notes' as SheetName,
  )
  const noteId = nextNumericId(
    'JN',
    existing.map((r) => r.id).filter((id): id is string => id != null),
  )
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body),
  )
  const createdAt = new Date().toISOString()
  await repo.appendRows(spreadsheetId, 'crm_notes' as SheetName, [
    {
      id: noteId,
      entity_type: 'job',
      entity_id: payload.job_id.trim(),
      body,
      referenced_entity_ids,
      severity,
      created_at: createdAt,
    },
  ])
}
