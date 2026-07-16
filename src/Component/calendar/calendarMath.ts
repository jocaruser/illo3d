/**
 * Native date math for the calendar — no date library, and everything in UTC
 * so a shop's day strings (`YYYY-MM-DD`) never shift under a timezone.
 */

/** A month cursor. `month` is 0-based, like `Date`. */
export interface CalendarMonth {
  year: number
  month: number
}

export const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

/** Monday-first, matching the shop's locales. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function monthOf(date: Date): CalendarMonth {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

/** Normalizes overflow (month 12 → next January, month -1 → last December). */
export function addMonths({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  return monthOf(new Date(Date.UTC(year, month + delta, 1)))
}

/** `YYYY-MM` — the prefix every day of this month starts with. */
export function monthPrefix({ year, month }: CalendarMonth): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function isInMonth(isoDay: string, month: CalendarMonth): boolean {
  return isoDay.startsWith(monthPrefix(month))
}

export function dayNumber(isoDay: string): number {
  return Number(isoDay.slice(8, 10))
}

/**
 * Whole weeks (Monday-first) covering the month: the leading and trailing
 * days belong to the neighbouring months and are rendered dimmed.
 */
export function buildMonthGrid({ year, month }: CalendarMonth): string[] {
  const first = new Date(Date.UTC(year, month, 1))
  const leading = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const weeks = Math.ceil((leading + daysInMonth) / 7)
  const days: string[] = []
  for (let offset = 0; offset < weeks * 7; offset += 1) {
    days.push(toIsoDay(new Date(Date.UTC(year, month, 1 - leading + offset))))
  }
  return days
}
