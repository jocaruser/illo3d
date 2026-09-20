import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '@/Config/version'
import { v1ToV2Plan } from '@/Migration/Plan/V1ToV2'
import { v2ToV3Plan } from '@/Migration/Plan/V2ToV3'
import { planChain } from '@/Migration/planChain'

describe('planChain', () => {
  it('chains both registered hops for a v1 shop targeting the app major', () => {
    expect(planChain('1.0.0')).toEqual([v1ToV2Plan, v2ToV3Plan])
  })

  it('resolves a single hop for a v2 shop', () => {
    expect(planChain('2.0.0')).toEqual([v2ToV3Plan])
  })

  it('resolves an empty chain when the shop matches the app major', () => {
    expect(planChain(APP_VERSION)).toEqual([])
  })

  it('throws when the shop version is unparseable', () => {
    expect(() => planChain('not-a-version')).toThrow(
      /Cannot migrate a shop versioned/
    )
  })

  it('throws when the app major cannot be resolved from the shop version alone', () => {
    expect(() => planChain('')).toThrow(/Cannot migrate/)
  })
})
