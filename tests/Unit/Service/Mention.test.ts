import { describe, expect, it } from 'vitest'
import { MENTION_PATTERN, parseMentionTokens, referencedEntityIdsFromBody } from '@/Service/Mention'

describe('MENTION_PATTERN', () => {
  it('is global and matches the three prefixes', () => {
    expect(MENTION_PATTERN.flags).toContain('g')
    expect('call @CL1 then @J22 and @P3'.match(MENTION_PATTERN)).toEqual([
      '@CL1',
      '@J22',
      '@P3',
    ])
  })
})

describe('parseMentionTokens', () => {
  it('extracts raw, id and kind per mention', () => {
    expect(parseMentionTokens('see @CL1, @J2 and @P3')).toEqual([
      { raw: '@CL1', id: 'CL1', kind: 'client' },
      { raw: '@J2', id: 'J2', kind: 'job' },
      { raw: '@P3', id: 'P3', kind: 'piece' },
    ])
  })

  it('keeps duplicates in order and ignores non-mentions', () => {
    expect(parseMentionTokens('@J1 @J1 email a@b.c @X9 @CL')).toEqual([
      { raw: '@J1', id: 'J1', kind: 'job' },
      { raw: '@J1', id: 'J1', kind: 'job' },
    ])
  })

  it('returns an empty list for plain text', () => {
    expect(parseMentionTokens('nothing here')).toEqual([])
  })
})

describe('referencedEntityIdsFromBody', () => {
  it('joins unique canonical ids with spaces, no @', () => {
    expect(referencedEntityIdsFromBody('ping @CL1 and @J2, again @CL1')).toBe('CL1 J2')
  })

  it('is empty when there are no mentions', () => {
    expect(referencedEntityIdsFromBody('no mentions')).toBe('')
  })
})
