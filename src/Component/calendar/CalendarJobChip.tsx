import { Link } from 'react-router-dom'
import { cx } from '@/Component/cx'
import { dueBandClasses } from '@/Component/kanban/dueBand'
import type { Job } from '@/Entity/Job'
import type { DueDateBand } from '@/Service/Pricing/dueDate'

/** One job placed on its effective due date. */
export interface CalendarEntry {
  job: Job
  /** `YYYY-MM-DD`. */
  day: string
  clientName: string
  band: DueDateBand
}

interface CalendarJobChipProps {
  entry: CalendarEntry
}

export function CalendarJobChip({ entry }: CalendarJobChipProps) {
  return (
    <Link
      to={`/jobs/${entry.job.id}`}
      className={cx(
        'block truncate rounded border px-1.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        dueBandClasses[entry.band]
      )}
    >
      <span className="font-medium">{entry.job.description}</span>
      {entry.clientName !== '' && <span className="opacity-80"> · {entry.clientName}</span>}
    </Link>
  )
}
