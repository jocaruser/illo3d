import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntityManager } from '@/Hook/useEntityManager'
import { daysSinceDueDate, dueDateBand } from '@/Service/Pricing/dueDate'
import { CalendarDayList } from './CalendarDayList'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import type { CalendarEntry } from './CalendarJobChip'
import {
  addMonths,
  countActiveJobsInMonth,
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
  const activeJobs = em.jobs.findActive()

  const entriesByDay = new Map<string, CalendarEntry[]>()
  for (const job of activeJobs) {
    const day = job.effectiveDueDate().slice(0, 10)
    if (!isInMonth(day, month)) continue
    const entry: CalendarEntry = {
      job,
      day,
      clientName: clientNames.get(job.clientId) ?? '',
      band: dueDateBand(daysSinceDueDate(job, { now: () => now })),
      countingPieceCount: em.pieces.findCountingByJob(job.id).length,
    }
    const existing = entriesByDay.get(day)
    if (existing === undefined) entriesByDay.set(day, [entry])
    else existing.push(entry)
  }

  const previousMonth = addMonths(month, -1)
  const nextMonth = addMonths(month, 1)
  const previousMonthJobCount = countActiveJobsInMonth(activeJobs, previousMonth)
  const nextMonthJobCount = countActiveJobsInMonth(activeJobs, nextMonth)

  const title = `${t(`calendar.month.${MONTH_KEYS[month.month]}`)} ${month.year}`
  const todayInVisibleMonth = isInMonth(todayIso, month)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            {t('calendar.previousMonthWithCount', { count: previousMonthJobCount })}
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-1"
            onClick={() => setMonth(monthOf(now))}
          >
            {t('calendar.today')}
          </button>
        </div>
        <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
        <button
          type="button"
          className="btn-secondary px-3 py-1"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          {t('calendar.nextMonthWithCount', { count: nextMonthJobCount })}
        </button>
      </div>

      {narrow ? (
        <CalendarDayList
          todayIso={todayIso}
          entriesByDay={entriesByDay}
          emptyMonthHighlightToday={entriesByDay.size === 0 && todayInVisibleMonth}
        />
      ) : (
        <CalendarMonthGrid month={month} todayIso={todayIso} entriesByDay={entriesByDay} />
      )}
    </div>
  )
}
