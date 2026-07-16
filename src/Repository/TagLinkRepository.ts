import type { SheetRecord } from '@/Entity/SheetEntity'
import { TagLink, type TaggableEntityType } from '@/Entity/TagLink'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class TagLinkRepository extends AbstractSheetRepository<TagLink> {
  protected readonly sheet = 'tag_links' as const
  protected readonly auditEntityName = 'tag_link' as const
  protected readonly idPrefix = 'TL'

  protected hydrate(record: SheetRecord): TagLink {
    return TagLink.fromRecord(record)
  }

  findActiveByEntity(entityType: TaggableEntityType, entityId: string): TagLink[] {
    return this.findActive().filter(
      (link) => link.entityType === entityType && link.entityId === entityId,
    )
  }

  hasActiveLink(tagId: string, entityType: TaggableEntityType, entityId: string): boolean {
    return this.findActiveByEntity(entityType, entityId).some((link) => link.tagId === tagId)
  }
}
