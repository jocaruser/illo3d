import { describe, it, expect } from 'vitest'
import { resolvePlanChain } from './registry'

describe('resolvePlanChain', () => {
  it('returns an empty chain when versions already match', () => {
    expect(resolvePlanChain(2, 2)).toEqual([])
  })

  it('throws while no plan covers the gap', () => {
    expect(() => resolvePlanChain(1, 2)).toThrow(
      'No migration path from v1 to v2'
    )
  })

  it('rejects downgrades', () => {
    expect(() => resolvePlanChain(2, 1)).toThrow('not supported')
  })
})
