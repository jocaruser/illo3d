import { useId, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cx } from '@/Component/cx'
import { JOB_STATUSES, type Job, type JobStatus } from '@/Entity/Job'
import type { DueDateBand } from '@/Service/Pricing/dueDate'
import type { JobPricingState } from '@/Service/Pricing/jobPricing'
import { formatCurrency } from '@/Service/Pricing/money'
import { dueBandClasses } from './dueBand'
import { setDragJobId } from './kanbanDnd'

/** Everything a card shows, resolved once by the board. */
export interface KanbanCard {
  job: Job
  clientName: string
  pricing: JobPricingState
  /** Null when the figure is not computable — the card then shows nothing. */
  benefit: number | null
  piecesDone: number
  piecesTotal: number
  dueBand: DueDateBand
  dueDay: string
}

interface JobCardProps {
  card: KanbanCard
  onStatusChange: (job: Job, next: JobStatus) => void
}

export function JobCard({ card, onStatusChange }: JobCardProps) {
  const { t } = useTranslation()
  const selectId = useId()
  const { job, pricing } = card

  const handleDragStart = (event: DragEvent<HTMLDivElement>): void => {
    setDragJobId(event.dataTransfer, job.id)
  }

  return (
    <div
      role="listitem"
      draggable
      onDragStart={handleDragStart}
      data-job-id={job.id}
      className="cursor-grab rounded-lg border border-border bg-surface-elevated p-3 shadow-sm active:cursor-grabbing"
    >
      <Link
        to={`/jobs/${job.id}`}
        className="font-medium text-text hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {job.description}
      </Link>

      <p className="mt-1 truncate text-xs text-text-muted">{card.clientName}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {pricing.complete ? (
          <span className="font-medium text-text">{formatCurrency(pricing.total)}</span>
        ) : (
          <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
            {t('jobs.totalIncomplete')}
          </span>
        )}
        {card.benefit !== null && (
          <span className="text-xs text-text-muted">({formatCurrency(card.benefit)})</span>
        )}
      </div>

      {card.piecesTotal > 0 && (
        <p className="mt-2 text-xs text-text-muted">
          {t('kanban.piecesProgress', {
            done: card.piecesDone,
            total: card.piecesTotal,
          })}
        </p>
      )}

      <span
        className={cx(
          'mt-2 inline-block rounded border px-1.5 py-0.5 text-xs',
          dueBandClasses[card.dueBand]
        )}
      >
        {t('kanban.dueOn', { date: card.dueDay })}
      </span>

      <label className="sr-only" htmlFor={selectId}>
        {t('jobs.statusFieldAria', { id: job.id })}
      </label>
      <select
        id={selectId}
        className="sr-only"
        value={job.status}
        onChange={(event) => onStatusChange(job, event.target.value as JobStatus)}
      >
        {JOB_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`jobs.status.${status}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
