import { describe, it, expect } from 'vitest'
import {
  findTagByTrimmedNameInsensitive,
  filterTagsByNameSubstring,
  normalizeTagNameKey,
  resolveTagCommitFromInput,
} from './tagNameMatch'

describe('normalizeTagNameKey', () => {
  it('trims and lowercases', () => {
    expect(normalizeTagNameKey('  VIP  ')).toBe('vip')
  })
})

describe('findTagByTrimmedNameInsensitive', () => {
  const tags = [
    { id: 'TG1', name: 'VIP' },
    { id: 'TG2', name: 'Wholesale' },
  ]

  it('matches case-insensitively', () => {
    expect(findTagByTrimmedNameInsensitive(tags, 'vip')?.id).toBe('TG1')
  })

  it('matches with surrounding whitespace on input', () => {
    expect(findTagByTrimmedNameInsensitive(tags, '  wholesale  ')?.id).toBe(
      'TG2',
    )
  })

  it('returns undefined when no match', () => {
    expect(findTagByTrimmedNameInsensitive(tags, 'Retail')).toBeUndefined()
  })

  it('returns undefined for blank input', () => {
    expect(findTagByTrimmedNameInsensitive(tags, '   ')).toBeUndefined()
  })
})

describe('filterTagsByNameSubstring', () => {
  const tags = [
    { id: 'TG1', name: 'VIP', created_at: '' },
    { id: 'TG2', name: 'Wholesale', created_at: '' },
    { id: 'TG3', name: 'Retail VIP', created_at: '' },
  ]

  it('returns all tags when query is empty', () => {
    expect(filterTagsByNameSubstring([...tags], '')).toHaveLength(3)
  })

  it('filters by substring case-insensitively', () => {
    const r = filterTagsByNameSubstring([...tags], 'vip')
    expect(r.map((t) => t.id).sort()).toEqual(['TG1', 'TG3'])
  })
})

describe('resolveTagCommitFromInput', () => {
  const tags = [
    { id: 'TG1', name: 'VIP' },
    { id: 'TG2', name: 'Wholesale' },
  ]

  it('returns link when text matches existing name', () => {
    expect(resolveTagCommitFromInput(tags, '  vip  ')).toEqual({
      type: 'link',
      tagId: 'TG1',
    })
  })

  it('returns create when no name match', () => {
    expect(resolveTagCommitFromInput(tags, 'New label')).toEqual({
      type: 'create',
      name: 'New label',
    })
  })

  it('returns null for empty input', () => {
    expect(resolveTagCommitFromInput(tags, '  ')).toBeNull()
  })
})
