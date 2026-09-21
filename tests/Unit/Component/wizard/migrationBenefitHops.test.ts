import { afterEach, describe, expect, it, vi } from 'vitest'
import { benefitHopsForShop } from '@/Component/wizard/migrationBenefitHops'
import * as planChainModule from '@/Migration/planChain'

describe('benefitHopsForShop', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists every hop still required for a v1 shop on a v3 app', () => {
    expect(benefitHopsForShop('1.9.0')).toEqual([
      { hopKey: 'v1ToV2' },
      { hopKey: 'v2ToV3' },
    ])
  })

  it('lists only v2→v3 for a shop one major behind the app', () => {
    expect(benefitHopsForShop('2.0.0')).toEqual([{ hopKey: 'v2ToV3' }])
  })

  it('lists both hops in order for a shop two majors behind the app', () => {
    expect(benefitHopsForShop('1.0.0')).toEqual([
      { hopKey: 'v1ToV2' },
      { hopKey: 'v2ToV3' },
    ])
  })

  it('returns an empty list when the chain cannot be resolved', () => {
    expect(benefitHopsForShop('not-a-version')).toEqual([])
  })

  it('omits hops that have no benefit copy mapping yet', () => {
    vi.spyOn(planChainModule, 'planChain').mockReturnValue([
      {
        fromMajor: 9,
        toMajor: 10,
        toVersion: '10.0.0',
        steps: [],
      },
    ])
    expect(benefitHopsForShop('9.0.0')).toEqual([])
  })
})
