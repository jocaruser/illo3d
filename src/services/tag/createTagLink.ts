import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { TagEntityType } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'

export async function createTagLink(
  spreadsheetId: string,
  tagId: string,
  entityType: TagEntityType,
  entityId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const links = await repo.readRows<{
    tag_id: string
    entity_type: string
    entity_id: string
  }>(spreadsheetId, 'tag_links' as SheetName)
  const exists = links.some(
    (l) =>
      l.tag_id?.trim() === tagId &&
      l.entity_type?.trim() === entityType &&
      l.entity_id?.trim() === entityId
  )
  if (exists) return

  const ids = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'tag_links' as SheetName
  )
  const id = nextNumericId(
    'TL',
    ids.map((r) => r.id).filter((x): x is string => x != null)
  )
  const created_at = new Date().toISOString()
  await repo.appendRows(spreadsheetId, 'tag_links' as SheetName, [
    { id, tag_id: tagId, entity_type: entityType, entity_id: entityId, created_at },
  ])
}
