import { SheetEntity, type SheetRecord } from './SheetEntity'

export const TAGGABLE_ENTITY_TYPES = ['client', 'job'] as const

export type TaggableEntityType = (typeof TAGGABLE_ENTITY_TYPES)[number]

export class TagLink extends SheetEntity {
  id = ''
  tagId = ''
  entityType: TaggableEntityType | '' = ''
  entityId = ''
  createdAt = ''

  static fromRecord(record: SheetRecord): TagLink {
    const link = new TagLink()
    link.id = record.id ?? ''
    link.tagId = record.tag_id ?? ''
    link.entityType = (TAGGABLE_ENTITY_TYPES as readonly string[]).includes(
      record.entity_type ?? '',
    )
      ? ((record.entity_type ?? '') as TaggableEntityType)
      : ''
    link.entityId = record.entity_id ?? ''
    link.createdAt = record.created_at ?? ''
    link.archived = record.archived ?? ''
    link.deleted = record.deleted ?? ''
    return link
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      tag_id: this.tagId,
      entity_type: this.entityType,
      entity_id: this.entityId,
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
