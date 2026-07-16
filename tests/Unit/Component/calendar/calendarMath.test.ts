import {
  addMonths,
  buildMonthGrid,
  dayNumber,
  isInMonth,
  monthOf,
  monthPrefix,
  toIsoDay,
} from '@/Component/calendar/calendarMath'

describe('calendarMath', () => {
  it('reads the month of a date in UTC', () => {
    expect(monthOf(new Date('2026-07-16T12:00:00.000Z'))).toEqual({ year: 2026, month: 6 })
  })

  it('formats an ISO day', () => {
    expect(toIsoDay(new Date('2026-07-16T23:30:00.000Z'))).toBe('2026-07-16')
  })

  it('steps months and rolls the year over in both directions', () => {
    expect(addMonths({ year: 2026, month: 6 }, 1)).toEqual({ year: 2026, month: 7 })
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('builds a zero-padded month prefix', () => {
    expect(monthPrefix({ year: 2026, month: 0 })).toBe('2026-01')
    expect(monthPrefix({ year: 2026, month: 11 })).toBe('2026-12')
  })

  it('tells whether a day belongs to a month', () => {
    expect(isInMonth('2026-07-01', { year: 2026, month: 6 })).toBe(true)
    expect(isInMonth('2026-08-01', { year: 2026, month: 6 })).toBe(false)
  })

  it('reads the day number', () => {
    expect(dayNumber('2026-07-09')).toBe(9)
  })

  describe('buildMonthGrid', () => {
    it('covers whole Monday-first weeks around the month', () => {
      // 2026-07-01 is a Wednesday, so the grid opens on Monday 2026-06-29.
      const days = buildMonthGrid({ year: 2026, month: 6 })

      expect(days).toHaveLength(35)
      expect(days[0]).toBe('2026-06-29')
      expect(days[2]).toBe('2026-07-01')
      expect(days[days.length - 1]).toBe('2026-08-02')
    })

    it('needs no leading days when the month opens on a Monday', () => {
      // 2026-06-01 is a Monday, so the grid opens on the 1st and still
      // completes the last week into July.
      const days = buildMonthGrid({ year: 2026, month: 5 })

      expect(days[0]).toBe('2026-06-01')
      expect(days).toHaveLength(35)
      expect(days[days.length - 1]).toBe('2026-07-05')
    })

    it('spreads to six weeks when the month needs them', () => {
      // 2026-08-01 is a Saturday: six rows to fit 31 days.
      expect(buildMonthGrid({ year: 2026, month: 7 })).toHaveLength(42)
    })

    it('handles a leap February', () => {
      const days = buildMonthGrid({ year: 2028, month: 1 })

      expect(days).toContain('2028-02-29')
      expect(isInMonth('2028-02-29', { year: 2028, month: 1 })).toBe(true)
    })
  })
})
