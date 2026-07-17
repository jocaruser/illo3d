import { describe, expect, it } from 'vitest'
import { isoDay, isoInstant, SystemClock } from '@/Service/Clock'
import { FixedClock } from './helpers'

describe('SystemClock', () => {
  it('returns the current time', () => {
    const before = Date.now()
    const now = new SystemClock().now().getTime()
    expect(now).toBeGreaterThanOrEqual(before)
    expect(now).toBeLessThanOrEqual(Date.now())
  })
})

describe('clock formatting', () => {
  const clock = new FixedClock('2026-07-16T09:30:00.000Z')

  it('isoInstant returns the full ISO 8601 instant', () => {
    expect(isoInstant(clock)).toBe('2026-07-16T09:30:00.000Z')
  })

  it('isoDay returns the YYYY-MM-DD prefix', () => {
    expect(isoDay(clock)).toBe('2026-07-16')
  })
})
