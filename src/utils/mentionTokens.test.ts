import { describe, it, expect } from 'vitest'
import {
  formatReferencedEntityIdsCell,
  mentionHrefForEntityId,
  parseMentionEntityIdsFromText,
  parseReferencedEntityIdsCell,
  segmentTextWithMentions,
} from './mentionTokens'

describe('parseMentionEntityIdsFromText', () => {
  it('extracts CL and J ids in first-appearance order', () => {
    expect(parseMentionEntityIdsFromText('Hi @CL2 and @J1 then @CL2')).toEqual([
      'CL2',
      'J1',
    ])
  })

  it('returns empty when no mentions', () => {
    expect(parseMentionEntityIdsFromText('no refs')).toEqual([])
  })

  it('extracts piece P ids', () => {
    expect(parseMentionEntityIdsFromText('See @P2')).toEqual(['P2'])
  })
})

describe('formatReferencedEntityIdsCell', () => {
  it('joins with spaces', () => {
    expect(formatReferencedEntityIdsCell(['CL1', 'J2'])).toBe('CL1 J2')
  })
})

describe('parseReferencedEntityIdsCell', () => {
  it('splits on whitespace', () => {
    expect(parseReferencedEntityIdsCell('CL1  J2')).toEqual(['CL1', 'J2'])
  })
})

describe('mentionHrefForEntityId', () => {
  it('maps CL and J prefixes', () => {
    expect(mentionHrefForEntityId('CL9')).toBe('/clients/CL9')
    expect(mentionHrefForEntityId('J3')).toBe('/jobs/J3')
    expect(mentionHrefForEntityId('XX1')).toBeNull()
  })

  it('maps P prefix to job URL with piece hash when piece is known', () => {
    expect(mentionHrefForEntityId('P2', [{ id: 'P2', job_id: 'J1' }])).toBe(
      '/jobs/J1#piece-P2'
    )
    expect(mentionHrefForEntityId('P2', [])).toBeNull()
  })
})

describe('segmentTextWithMentions', () => {
  it('segments plain text', () => {
    expect(segmentTextWithMentions('abc')).toEqual([{ kind: 'text', value: 'abc' }])
  })

  it('segments mixed', () => {
    expect(segmentTextWithMentions('a @CL1 b')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'mention', entityId: 'CL1' },
      { kind: 'text', value: ' b' },
    ])
  })

  it('segments piece mentions', () => {
    expect(segmentTextWithMentions('@P2 done')).toEqual([
      { kind: 'mention', entityId: 'P2' },
      { kind: 'text', value: ' done' },
    ])
  })
})
