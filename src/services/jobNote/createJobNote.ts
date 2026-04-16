import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToCrmNotes } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { assertClientNoteSeverity } from '@/services/clientNote/severity'
import {
  formatReferencedEntityIdsCell,
  parseMentionEntityIdsFromText,
} from '@/utils/mentionTokens'
import { useWorkbookStore } from '@/stores/workbookStore'

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
  const existing = matrixToCrmNotes(useWorkbookStore.getState().tabs.crm_notes)
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
  patchWorkbookTab('crm_notes', (m) =>
    appendDataRow('crm_notes', m, {
      id: noteId,
      entity_type: 'job',
      entity_id: payload.job_id.trim(),
      body,
      referenced_entity_ids,
      severity,
      created_at: createdAt,
      archived: '',
      deleted: '',
    }),
  )
}
