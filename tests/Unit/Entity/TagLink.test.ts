import { describe, expect, it } from 'vitest'
import { TAGGABLE_ENTITY_TYPES, TagLink } from '@/Entity/TagLink'

describe('TagLink', () => {
  it('round-trips fromRecord/toRecord', () => {
    const record = {
      id: 'TL1',
      tag_id: 'TG1',
      entity_type: 'client',
      entity_id: 'CL1',
      created_at: '2026-01-01T00:00:00.000Z',
      archived: '',
      deleted: '',
    }
    const link = TagLink.fromRecord(record)
    expect(link.entityType).toBe('client')
    expect(link.toRecord()).toEqual(record)
  })

  it('accepts the job entity type and blanks unknown ones', () => {
    expect(TAGGABLE_ENTITY_TYPES).toEqual(['client', 'job'])
    expect(TagLink.fromRecord({ entity_type: 'job' }).entityType).toBe('job')
    expect(TagLink.fromRecord({ entity_type: 'piece' }).entityType).toBe('')
    expect(TagLink.fromRecord({}).entityType).toBe('')
  })
})
