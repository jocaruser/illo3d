import {
  findLastDataRowIndexById,
  removeDataRowAt,
} from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'

export async function deleteClientNote(
  spreadsheetId: string,
  noteId: string
): Promise<void> {
  void spreadsheetId
  patchWorkbookTab('crm_notes', (m) => {
    const i = findLastDataRowIndexById(m, 'crm_notes', noteId)
    if (i === -1) {
      throw new Error(`Client note ${noteId} not found`)
    }
    return removeDataRowAt(m, i)
  })
}
