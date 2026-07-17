import { describe, expect, it } from 'vitest'
import { computeRedos, redoBand } from '@/Service/Pricing/redos'

describe('redoBand', () => {
  it('bands ≥2 safe, 1 tight, ≤0 risky', () => {
    expect(redoBand(5)).toBe('safe')
    expect(redoBand(2)).toBe('safe')
    expect(redoBand(1)).toBe('tight')
    expect(redoBand(0)).toBe('risky')
  })
})

describe('computeRedos', () => {
  it('computes floor((qty − need) / need)', () => {
    expect(computeRedos(1000, 100)).toEqual({ redos: 9, band: 'safe' })
    expect(computeRedos(250, 100)).toEqual({ redos: 1, band: 'tight' })
    expect(computeRedos(199, 100)).toEqual({ redos: 0, band: 'risky' })
    expect(computeRedos(300, 100)).toEqual({ redos: 2, band: 'safe' })
  })

  it('floors negative margins at 0 redos', () => {
    expect(computeRedos(50, 100)).toEqual({ redos: 0, band: 'risky' })
    expect(computeRedos(0, 100)).toEqual({ redos: 0, band: 'risky' })
  })

  it('treats a non-positive need as 1', () => {
    expect(computeRedos(3, 0)).toEqual({ redos: 2, band: 'safe' })
    expect(computeRedos(2, -5)).toEqual({ redos: 1, band: 'tight' })
  })
})
