import { formatRelativeTime } from '@/Component/formatRelativeTime'

const now = new Date('2026-07-09T14:30:00Z')

function secondsBefore(seconds: number): string {
  return new Date(now.getTime() - seconds * 1000).toISOString()
}

describe('formatRelativeTime', () => {
  it('echoes invalid input in both fields', () => {
    expect(formatRelativeTime('not-a-date', 'en', now)).toEqual({
      text: 'not-a-date',
      absolute: 'not-a-date',
    })
    expect(formatRelativeTime('', 'en', now)).toEqual({ text: '', absolute: '' })
  })

  it('formats seconds under a minute', () => {
    expect(formatRelativeTime(secondsBefore(30), 'en', now).text).toBe('30 seconds ago')
    expect(formatRelativeTime(secondsBefore(59), 'en', now).text).toBe('59 seconds ago')
  })

  it('switches to minutes at the 60-second boundary', () => {
    expect(formatRelativeTime(secondsBefore(60), 'en', now).text).toBe('1 minute ago')
    expect(formatRelativeTime(secondsBefore(300), 'en', now).text).toBe('5 minutes ago')
    expect(formatRelativeTime(secondsBefore(3599), 'en', now).text).toBe('59 minutes ago')
  })

  it('switches to hours at the 60-minute boundary', () => {
    expect(formatRelativeTime(secondsBefore(3600), 'en', now).text).toBe('1 hour ago')
    expect(formatRelativeTime(secondsBefore(86399), 'en', now).text).toBe('23 hours ago')
  })

  it('switches to days at the 24-hour boundary', () => {
    expect(formatRelativeTime(secondsBefore(86400), 'en', now).text).toBe('yesterday')
    expect(formatRelativeTime(secondsBefore(2 * 86400), 'en', now).text).toBe('2 days ago')
    expect(formatRelativeTime(secondsBefore(29 * 86400), 'en', now).text).toBe('29 days ago')
  })

  it('switches to months at the 30-day boundary', () => {
    expect(formatRelativeTime(secondsBefore(30 * 86400), 'en', now).text).toBe('last month')
    expect(formatRelativeTime(secondsBefore(60 * 86400), 'en', now).text).toBe('2 months ago')
  })

  it('switches to years at the 365-day boundary', () => {
    expect(formatRelativeTime(secondsBefore(365 * 86400), 'en', now).text).toBe('last year')
    expect(formatRelativeTime(secondsBefore(730 * 86400), 'en', now).text).toBe('2 years ago')
  })

  it('formats future dates', () => {
    expect(formatRelativeTime(secondsBefore(-300), 'en', now).text).toBe('in 5 minutes')
  })

  it('respects the active language', () => {
    expect(formatRelativeTime(secondsBefore(300), 'es', now).text).toBe('hace 5 minutos')
  })

  it('formats the absolute timestamp with medium date and short time', () => {
    const { absolute } = formatRelativeTime('2026-07-09T14:25:00Z', 'en', now)
    expect(absolute).toMatch(/Jul 9, 2026/)
    expect(absolute).toMatch(/\d{1,2}:\d{2}/)
  })

  it('defaults now to the current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    try {
      expect(formatRelativeTime(secondsBefore(300), 'en').text).toBe('5 minutes ago')
    } finally {
      vi.useRealTimers()
    }
  })
})
