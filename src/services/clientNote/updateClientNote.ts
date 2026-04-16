import {
  ensureMatrix,
  headerIndex,
  updateLastDataRowById,
} from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { useWorkbookStore } from '@/stores/workbookStore'
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
  void spreadsheetId
  const m0 = ensureMatrix(useWorkbookStore.getState().tabs, 'crm_notes')
  const idc = headerIndex('crm_notes', 'id')
  const matches: number[] = []
  for (let i = 1; i < m0.length; i++) {
    if ((m0[i][idc] ?? '').trim() === noteId.trim()) matches.push(i)
  }
  const idx = matches.length ? matches[matches.length - 1] : -1
  if (idx === -1) {
    throw new Error(`Client note ${noteId} not found`)
  }
  const existing = m0[idx]
  const headers = m0[0]
  const get = (h: string) =>
    existing[headers.indexOf(h)]?.trim() ?? ''
  const severity = assertClientNoteSeverity(payload.severity)
  const body = payload.body.trim()
  const referenced_entity_ids = formatReferencedEntityIdsCell(
    parseMentionEntityIdsFromText(body),
  )
  const row = {
    id: get('id'),
    entity_type: get('entity_type') || 'client',
    entity_id: get('entity_id'),
    body,
    referenced_entity_ids,
    severity,
    created_at: get('created_at'),
    archived: get('archived'),
    deleted: get('deleted'),
  }
  patchWorkbookTab('crm_notes', (m) =>
    updateLastDataRowById('crm_notes', m, noteId, row),
  )
}
