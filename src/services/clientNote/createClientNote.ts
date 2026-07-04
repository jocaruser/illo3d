import { auditCreate, getExistingIdsForEntity } from '@/services/audit/auditEventEmitter'
import { nextNumericId } from '@/utils/id'
import { assertClientNoteSeverity } from './severity'
import {
  formatReferencedEntityIdsCell,
  parseMentionEntityIdsFromText,
} from '@/utils/mentionTokens'

export interface CreateClientNotePayload {
  client_id: string
  body: string
  severity: string
}

export async function createClientNote(
  spreadsheetId: string,
  payload: CreateClientNotePayload
): Promise<void> {
  void spreadsheetId
  const noteId = nextNumericId(
    'CN',
    getExistingIdsForEntity('crm_note', 'CN'),
  )
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body),
  )
  const createdAt = new Date().toISOString()
  auditCreate('crm_note', noteId, {
    id: noteId,
    entity_type: 'client',
    entity_id: payload.client_id.trim(),
    body,
    referenced_entity_ids,
    severity,
    created_at: createdAt,
    archived: '',
    deleted: '',
  })
}
