import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'

describe('formatRelativeTime', () => {
  const now = new Date('2026-07-09T14:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns raw string for invalid input', () => {
    expect(formatRelativeTime('not-a-date')).toEqual({
      text: 'not-a-date',
      absolute: 'not-a-date',
    })
  })

  it('returns "just now" for timestamps under 60 seconds', () => {
    const result = formatRelativeTime('2026-07-09T13:59:30.000Z')
    expect(result.text).toBe('just now')
    expect(result.absolute).toMatch(/Jul 9, 2026/)
  })

  it('returns minutes for timestamps under 1 hour', () => {
    const result = formatRelativeTime('2026-07-09T13:55:00.000Z')
    expect(result.text).toBe('5 minutes ago')
    expect(result.absolute).toMatch(/Jul 9, 2026/)
  })

  it('returns hours for timestamps under 24 hours', () => {
    const result = formatRelativeTime('2026-07-09T10:00:00.000Z')
    expect(result.text).toBe('4 hours ago')
    expect(result.absolute).toMatch(/Jul 9, 2026/)
  })

  it('returns days for timestamps under 7 days', () => {
    const result = formatRelativeTime('2026-07-07T14:00:00.000Z')
    expect(result.text).toBe('2 days ago')
    expect(result.absolute).toMatch(/Jul 7, 2026/)
  })

  it('returns "yesterday" for 1 day ago when numeric is auto', () => {
    const result = formatRelativeTime('2026-07-08T14:00:00.000Z')
    expect(result.text).toBe('yesterday')
    expect(result.absolute).toMatch(/Jul 8, 2026/)
  })

  it('returns weeks for timestamps under 30 days', () => {
    const result = formatRelativeTime('2026-06-20T14:00:00.000Z')
    expect(result.text).toBe('3 weeks ago')
    expect(result.absolute).toMatch(/Jun 20, 2026/)
  })

  it('returns months for timestamps under 1 year', () => {
    const result = formatRelativeTime('2026-01-15T09:00:00.000Z')
    expect(result.text).toBe('6 months ago')
    expect(result.absolute).toMatch(/Jan 15, 2026/)
  })

  it('returns "last month" for 1 month ago when numeric is auto', () => {
    const result = formatRelativeTime('2026-06-09T14:00:00.000Z')
    expect(result.text).toBe('last month')
    expect(result.absolute).toMatch(/Jun 9, 2026/)
  })

  it('returns years for timestamps over 1 year', () => {
    const result = formatRelativeTime('2025-01-09T14:00:00.000Z')
    expect(result.text).toBe('last year')
    expect(result.absolute).toMatch(/Jan 9, 2025/)
  })

  it('returns multiple years for very old timestamps', () => {
    const result = formatRelativeTime('2023-01-09T14:00:00.000Z')
    expect(result.text).toBe('3 years ago')
    expect(result.absolute).toMatch(/Jan 9, 2023/)
  })
})
