import { Tag } from '@/Entity/Tag'
import { TagLink, type TaggableEntityType } from '@/Entity/TagLink'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoInstant } from './Clock'

export type TagResult = { ok: true; tag: Tag } | { ok: false; error: string }

/** Each whitespace-separated word: first character upper, the rest lower. */
export function formatTagNameTitleCase(name: string): string {
  const trimmed = name.trim()
  if (trimmed === '') return ''
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export class TagService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Link a tag to a client or job, reusing an existing tag case-insensitively
   * or creating a Title Cased one. No-op when the link already exists.
   */
  addTagToEntity(entityType: TaggableEntityType, entityId: string, name: string): TagResult {
    if (name.trim() === '') return { ok: false, error: 'purchase.validation.required' }

    let tag = this.em.tags.findActiveByName(name)
    if (tag === null) {
      tag = new Tag()
      tag.id = this.em.tags.nextId()
      tag.name = formatTagNameTitleCase(name)
      tag.createdAt = isoInstant(this.em.clock)
      this.em.tags.save(tag)
    }

    if (!this.em.tagLinks.hasActiveLink(tag.id, entityType, entityId)) {
      const link = new TagLink()
      link.id = this.em.tagLinks.nextId()
      link.tagId = tag.id
      link.entityType = entityType
      link.entityId = entityId
      link.createdAt = isoInstant(this.em.clock)
      this.em.tagLinks.save(link)
    }
    return { ok: true, tag }
  }

  /** Tag links are the one hard-deleted sheet: the row is physically removed. */
  removeTagFromEntity(entityType: TaggableEntityType, entityId: string, tagId: string): void {
    for (const link of this.em.tagLinks.findActiveByEntity(entityType, entityId)) {
      if (link.tagId === tagId) this.em.tagLinks.remove(link.id)
    }
  }

  listTagsForEntity(entityType: TaggableEntityType, entityId: string): Tag[] {
    const tags: Tag[] = []
    for (const link of this.em.tagLinks.findActiveByEntity(entityType, entityId)) {
      const tag = this.em.tags.find(link.tagId)
      if (tag !== null && tag.isActive()) tags.push(tag)
    }
    return tags
  }
}
