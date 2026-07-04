import { auditDelete } from '@/services/audit/auditEventEmitter'
import { getCurrentNotesForEntity } from '@/services/audit/reconstruct'
import type { CrmNoteEntityType } from '@/types/money'

export async function deleteCrmNotesForEntity(
  spreadsheetId: string,
  entityType: CrmNoteEntityType,
  entityId: string
): Promise<void> {
  void spreadsheetId
  const notes = getCurrentNotesForEntity(entityType, entityId)
  for (const note of notes) {
    if (note.deleted) continue
    auditDelete('crm_note', note.id, note)
  }
}
