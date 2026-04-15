import type { Tag } from '@/types/money'

export function normalizeTagNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export function findTagByTrimmedNameInsensitive(
  tags: readonly Pick<Tag, 'id' | 'name'>[],
  input: string,
): Pick<Tag, 'id' | 'name'> | undefined {
  const key = normalizeTagNameKey(input)
  if (!key) return undefined
  return tags.find((t) => normalizeTagNameKey(t.name) === key)
}

export function filterTagsByNameSubstring(
  tags: readonly Tag[],
  query: string,
): Tag[] {
  const key = normalizeTagNameKey(query)
  if (!key) return [...tags]
  return tags.filter((tag) =>
    normalizeTagNameKey(tag.name).includes(key),
  )
}

export type TagCommitPayload =
  | { type: 'link'; tagId: string }
  | { type: 'create'; name: string }

export function resolveTagCommitFromInput(
  allTags: readonly Pick<Tag, 'id' | 'name'>[],
  input: string,
): TagCommitPayload | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const existing = findTagByTrimmedNameInsensitive(allTags, trimmed)
  if (existing) return { type: 'link', tagId: existing.id }
  return { type: 'create', name: trimmed }
}
