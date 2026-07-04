import { auditCreate, getExistingIdsForEntity } from '@/services/audit/auditEventEmitter'
import { nextNumericId } from '@/utils/id'
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
  void spreadsheetId
  const noteId = nextNumericId(
    'JN',
    getExistingIdsForEntity('crm_note', 'JN'),
  )
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body),
  )
  const createdAt = new Date().toISOString()
  auditCreate('crm_note', noteId, {
    id: noteId,
    entity_type: 'job',
    entity_id: payload.job_id.trim(),
    body,
    referenced_entity_ids,
    severity,
    created_at: createdAt,
    archived: '',
    deleted: '',
  })
}
