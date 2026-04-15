import type { TagLink } from '@/types/money'

export type TagNavPath = '/clients' | '/jobs'

export function tagNavigatePath(tagLinks: TagLink[], tagId: string): TagNavPath {
  const mine = tagLinks.filter((l) => l.tag_id === tagId)
  if (mine.some((l) => l.entity_type === 'client')) {
    return '/clients'
  }
  if (mine.some((l) => l.entity_type === 'job')) {
    return '/jobs'
  }
  return '/clients'
}
