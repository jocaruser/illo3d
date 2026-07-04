import { auditCreate } from '@/services/audit/auditEventEmitter'
import { getCurrentTagLinksForEntity } from '@/services/audit/reconstruct'
import { nextNumericId } from '@/utils/id'
import type { TagEntityType } from '@/types/money'

export async function createTagLink(
  spreadsheetId: string,
  tagId: string,
  entityType: TagEntityType,
  entityId: string
): Promise<void> {
  void spreadsheetId
  const links = getCurrentTagLinksForEntity(entityType, entityId)
  const exists = links.some(
    (l) =>
      l.tag_id?.trim() === tagId &&
      l.entity_type?.trim() === entityType &&
      l.entity_id?.trim() === entityId,
  )
  if (exists) return

  const id = nextNumericId(
    'TL',
    getCurrentTagLinksForEntity(entityType, entityId).map((r) => r.id),
  )
  const created_at = new Date().toISOString()
  auditCreate('tag_link', id, {
    id,
    tag_id: tagId,
    entity_type: entityType,
    entity_id: entityId,
    created_at,
    archived: '',
    deleted: '',
  })
}
