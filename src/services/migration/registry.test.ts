import { describe, it, expect } from 'vitest'
import { resolvePlanChain } from './registry'
import { v1ToV2Plan } from './plans/v1-to-v2/plan'

describe('resolvePlanChain', () => {
  it('resolves the single v1→v2 hop', () => {
    expect(resolvePlanChain(1, 2)).toEqual([v1ToV2Plan])
  })

  it('returns an empty chain when versions already match', () => {
    expect(resolvePlanChain(2, 2)).toEqual([])
  })

  it('throws when no plan covers the gap', () => {
    expect(() => resolvePlanChain(0, 2)).toThrow(
      'No migration path from v0 to v2'
    )
    expect(() => resolvePlanChain(2, 3)).toThrow(
      'No migration path from v2 to v3'
    )
  })

  it('rejects downgrades', () => {
    expect(() => resolvePlanChain(2, 1)).toThrow('not supported')
  })
})
