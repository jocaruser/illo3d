import type { SheetRecord } from '@/Entity/SheetEntity'
import { Tag } from '@/Entity/Tag'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class TagRepository extends AbstractSheetRepository<Tag> {
  protected readonly sheet = 'tags' as const
  protected readonly auditEntityName = 'tag' as const
  protected readonly idPrefix = 'TG'

  protected hydrate(record: SheetRecord): Tag {
    return Tag.fromRecord(record)
  }

  /** Case-insensitive, trimmed name lookup so tag names are reused, not duplicated. */
  findActiveByName(name: string): Tag | null {
    const normalized = name.trim().toLowerCase()
    return (
      this.findActive().find((tag) => tag.name.trim().toLowerCase() === normalized) ?? null
    )
  }
}
