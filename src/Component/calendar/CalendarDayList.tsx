import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { CalendarJobChip, type CalendarEntry } from './CalendarJobChip'

interface CalendarDayListProps {
  todayIso: string
  entriesByDay: Map<string, CalendarEntry[]>
}

/**
 * Mobile view: a month grid is unreadable under 640px, so the same month
 * becomes a chronological list of the days that actually have work due.
 */
export function CalendarDayList({ todayIso, entriesByDay }: CalendarDayListProps) {
  const { t } = useTranslation()
  const days = [...entriesByDay.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <ul className="space-y-3">
      {days.map(([day, entries]) => (
        <li key={day} data-testid="calendar-day" data-day={day}>
          <h3 className={cx('text-sm font-semibold', day === todayIso ? 'text-primary' : 'text-text')}>
            {day}
            {day === todayIso && <span className="ml-2 text-xs">{t('calendar.today')}</span>}
          </h3>
          <div className="mt-1 space-y-1">
            {entries.map((entry) => (
              <CalendarJobChip key={entry.job.id} entry={entry} />
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
