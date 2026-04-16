import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToTagLinks } from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import type { TagEntityType } from '@/types/money'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function createTagLink(
  spreadsheetId: string,
  tagId: string,
  entityType: TagEntityType,
  entityId: string
): Promise<void> {
  void spreadsheetId
  const links = matrixToTagLinks(useWorkbookStore.getState().tabs.tag_links)
  const exists = links.some(
    (l) =>
      l.tag_id?.trim() === tagId &&
      l.entity_type?.trim() === entityType &&
      l.entity_id?.trim() === entityId,
  )
  if (exists) return

  const id = nextNumericId(
    'TL',
    links.map((r) => r.id).filter((x): x is string => x != null),
  )
  const created_at = new Date().toISOString()
  patchWorkbookTab('tag_links', (m) =>
    appendDataRow('tag_links', m, {
      id,
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
      created_at,
      archived: '',
      deleted: '',
    }),
  )
}
