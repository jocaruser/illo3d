import { headerIndex } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'

export async function deleteCrmNotesForEntity(
  spreadsheetId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  void spreadsheetId
  const typeKey = entityType.trim()
  const idKey = entityId.trim()
  patchWorkbookTab('crm_notes', (m) => {
    const et = headerIndex('crm_notes', 'entity_type')
    const eid = headerIndex('crm_notes', 'entity_id')
    return m.filter(
      (row, i) =>
        i === 0 ||
        (row[et] ?? '').trim() !== typeKey ||
        (row[eid] ?? '').trim() !== idKey,
    )
  })
}
