import { auditUpdate } from '@/services/audit/auditEventEmitter'
import { getNoteById } from '@/services/audit/reconstruct'
import { assertClientNoteSeverity } from '@/services/clientNote/severity'
import {
  formatReferencedEntityIdsCell,
  parseMentionEntityIdsFromText,
} from '@/utils/mentionTokens'

export interface UpdateJobNotePayload {
  body: string
  severity: string
}

export async function updateJobNote(
  spreadsheetId: string,
  noteId: string,
  payload: UpdateJobNotePayload,
): Promise<void> {
  void spreadsheetId
  const existing = getNoteById(noteId)
  if (!existing) {
    throw new Error(`Job note ${noteId} not found`)
  }
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body),
  )
  const row = {
    id: existing.id,
    entity_type: existing.entity_type,
    entity_id: existing.entity_id,
    body,
    referenced_entity_ids,
    severity,
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }
  auditUpdate('crm_note', noteId, existing, row)
}
