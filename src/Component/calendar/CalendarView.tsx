import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/Component/EmptyState'
import { useEntityManager } from '@/Hook/useEntityManager'
import { daysSinceDueDate, dueDateBand } from '@/Service/Pricing/dueDate'
import { CalendarDayList } from './CalendarDayList'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import type { CalendarEntry } from './CalendarJobChip'
import {
  addMonths,
  isInMonth,
  monthOf,
  MONTH_KEYS,
  toIsoDay,
  type CalendarMonth,
} from './calendarMath'

/** Below this the month grid stops being readable and becomes a day list. */
const NARROW_MAX_WIDTH = 640

function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW_MAX_WIDTH)
  useEffect(() => {
    const onResize = (): void => setNarrow(window.innerWidth < NARROW_MAX_WIDTH)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return narrow
}

interface CalendarViewProps {
  /** Defaults to the entity manager's clock; injected by tests. */
  today?: Date
}

/**
 * The v3 calendar: `jobs.due_date` finally gives the shop a view of what is
 * due when, instead of inferring urgency from a kanban column.
 */
export function CalendarView({ today }: CalendarViewProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const now = today ?? em.clock.now()
  const [month, setMonth] = useState<CalendarMonth>(() => monthOf(now))
  const narrow = useIsNarrow()

  const todayIso = toIsoDay(now)
  const clientNames = new Map(em.clients.findAll().map((client) => [client.id, client.name]))

  const entriesByDay = new Map<string, CalendarEntry[]>()
  for (const job of em.jobs.findActive()) {
    const day = job.effectiveDueDate().slice(0, 10)
    if (!isInMonth(day, month)) continue
    const entry: CalendarEntry = {
      job,
      day,
      clientName: clientNames.get(job.clientId) ?? '',
      band: dueDateBand(daysSinceDueDate(job, { now: () => now })),
    }
    const existing = entriesByDay.get(day)
    if (existing === undefined) entriesByDay.set(day, [entry])
    else existing.push(entry)
  }

  const title = `${t(`calendar.month.${MONTH_KEYS[month.month]}`)} ${month.year}`

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-1"
          aria-label={t('calendar.previousMonth')}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          ‹
        </button>
        <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
        <button
          type="button"
          className="btn-secondary px-3 py-1"
          aria-label={t('calendar.nextMonth')}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          ›
        </button>
      </div>

      {entriesByDay.size === 0 ? (
        <EmptyState message={t('calendar.empty')} />
      ) : narrow ? (
        <CalendarDayList todayIso={todayIso} entriesByDay={entriesByDay} />
      ) : (
        <CalendarMonthGrid month={month} todayIso={todayIso} entriesByDay={entriesByDay} />
      )}
    </div>
  )
}
