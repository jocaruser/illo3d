import { auditDelete } from '@/services/audit/auditEventEmitter'
import { getNoteById } from '@/services/audit/reconstruct'

export async function deleteJobNote(
  spreadsheetId: string,
  noteId: string,
): Promise<void> {
  void spreadsheetId
  const existing = getNoteById(noteId)
  if (!existing) {
    throw new Error(`Job note ${noteId} not found`)
  }
  auditDelete('crm_note', noteId, existing)
}
