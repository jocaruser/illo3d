import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { CalendarJobChip, type CalendarEntry } from './CalendarJobChip'
import {
  buildMonthGrid,
  dayNumber,
  isInMonth,
  WEEKDAY_KEYS,
  type CalendarMonth,
} from './calendarMath'

interface CalendarMonthGridProps {
  month: CalendarMonth
  todayIso: string
  entriesByDay: Map<string, CalendarEntry[]>
}

/** Desktop view: whole weeks, Monday-first, jobs sitting on their due day. */
export function CalendarMonthGrid({ month, todayIso, entriesByDay }: CalendarMonthGridProps) {
  const { t } = useTranslation()
  const days = buildMonthGrid(month)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAY_KEYS.map((key) => (
          <div key={key} className="px-1 text-xs font-medium uppercase text-text-muted">
            <span aria-hidden="true">{t(`calendar.weekday.${key}`)}</span>
            <span className="sr-only">{t(`calendar.weekdayLong.${key}`)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isInMonth(day, month)
          const entries = inMonth ? (entriesByDay.get(day) ?? []) : []
          return (
            <div
              key={day}
              data-testid="calendar-day"
              data-day={day}
              className={cx(
                'min-h-[5rem] rounded border p-1',
                inMonth
                  ? 'border-border bg-surface-elevated'
                  : 'border-transparent bg-surface-alt/40',
                day === todayIso && 'ring-2 ring-primary'
              )}
            >
              <span
                className={cx(
                  'text-xs',
                  inMonth ? 'text-text' : 'text-text-muted/60',
                  day === todayIso && 'font-semibold text-primary'
                )}
              >
                {dayNumber(day)}
              </span>
              <div className="mt-1 space-y-1">
                {entries.map((entry) => (
                  <CalendarJobChip key={entry.job.id} entry={entry} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
