import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToTags } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function createTag(
  spreadsheetId: string,
  name: string
): Promise<string> {
  void spreadsheetId
  const normalized = formatTagNameTitleCase(name)
  if (!normalized) {
    throw new Error('Tag name is required')
  }
  const existing = matrixToTags(useWorkbookStore.getState().tabs.tags)
  const id = nextNumericId(
    'TG',
    existing.map((r) => r.id).filter((x): x is string => x != null),
  )
  const created_at = new Date().toISOString()
  patchWorkbookTab('tags', (m) =>
    appendDataRow('tags', m, {
      id,
      name: normalized,
      created_at,
      archived: '',
      deleted: '',
    }),
  )
  return id
}
