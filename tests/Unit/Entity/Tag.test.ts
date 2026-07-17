import { describe, expect, it } from 'vitest'
import { Tag } from '@/Entity/Tag'

describe('Tag', () => {
  it('round-trips fromRecord/toRecord', () => {
    const record = {
      id: 'TG1',
      name: 'Vip',
      created_at: '2026-01-01T00:00:00.000Z',
      archived: '',
      deleted: '',
    }
    expect(Tag.fromRecord(record).toRecord()).toEqual(record)
  })

  it('defaults missing cells', () => {
    const tag = Tag.fromRecord({})
    expect(tag.toRecord()).toEqual({
      id: '',
      name: '',
      created_at: '',
      archived: '',
      deleted: '',
    })
  })
})
