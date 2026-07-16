import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Combobox } from '@/Component/Combobox'
import { cx } from '@/Component/cx'
import { RelativeTime } from '@/Component/RelativeTime'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import { SortableColumnHeader } from '@/Component/table/SortableColumnHeader'
import { JOB_STATUSES, type Job, type JobStatus } from '@/Entity/Job'
import { daysSinceDueDate, dueDateBand, type DueDateBand } from '@/Service/Pricing/dueDate'
import type { JobPricingState } from '@/Service/Pricing/jobPricing'
import { formatCurrency } from '@/Service/Pricing/money'
import { SystemClock, type Clock } from '@/Service/Clock'
import { TagTooltip } from './TagTooltip'
import { sortRows, useTableSort, type SortValue } from './tableSort'

export type JobSortKey = 'id' | 'description' | 'client' | 'status' | 'total' | 'dueDate' | 'createdAt'

interface JobsTableProps {
  rows: Job[]
  clientName: (clientId: string) => string
  tagNames: (jobId: string) => string[]
  pricingOf: (jobId: string) => JobPricingState
  emptyMessage: string
  onStatusChange: (job: Job, next: JobStatus) => void
  onEdit: (job: Job) => void
  onArchive: (job: Job) => void
  clock?: Clock
}

const COLUMN_COUNT = 8

/** Client (3rd) appears at md; Total, Due date and Created (5–7) at lg. */
const responsiveColumns = cx(
  '[&_tr>*:nth-child(3)]:hidden md:[&_tr>*:nth-child(3)]:table-cell',
  '[&_tr>*:nth-child(5)]:hidden lg:[&_tr>*:nth-child(5)]:table-cell',
  '[&_tr>*:nth-child(6)]:hidden lg:[&_tr>*:nth-child(6)]:table-cell',
  '[&_tr>*:nth-child(7)]:hidden lg:[&_tr>*:nth-child(7)]:table-cell'
)

const bandClasses: Record<DueDateBand, string> = {
  red: 'bg-gradient-to-r from-danger/30 to-danger/10 text-danger',
  orange: 'bg-gradient-to-r from-warning/30 to-warning/10 text-warning',
  yellow: 'bg-gradient-to-r from-warning/20 to-warning/5 text-warning',
  none: 'bg-surface-alt text-text-muted',
}

interface DueDateBadgeProps {
  job: Job
  clock?: Clock
}

/** Due date with a gradient band that intensifies as the job runs late. */
export function DueDateBadge({ job, clock = new SystemClock() }: DueDateBadgeProps) {
  const { t } = useTranslation()
  const due = job.effectiveDueDate()
  if (due === '') return <span className="text-text-muted">—</span>

  const days = daysSinceDueDate(job, clock)
  const band = dueDateBand(days)
  const title = days > 0 ? t('jobs.dueDateOverdueDays', { count: days }) : t('jobs.dueDateOnTrack')
  return (
    <span
      title={title}
      data-band={band}
      className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', bandClasses[band])}
    >
      {due.slice(0, 10)}
    </span>
  )
}

interface JobTotalProps {
  pricing: JobPricingState
}

/** A job's derived total, or the distinct incomplete-pricing badge. */
export function JobTotal({ pricing }: JobTotalProps) {
  const { t } = useTranslation()
  if (!pricing.complete) {
    return (
      <span className="inline-block rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        {t('jobs.totalIncomplete')}
      </span>
    )
  }
  return <span className="tabular-nums">{formatCurrency(pricing.total)}</span>
}

export function JobsTable({
  rows,
  clientName,
  tagNames,
  pricingOf,
  emptyMessage,
  onStatusChange,
  onEdit,
  onArchive,
  clock,
}: JobsTableProps) {
  const { t } = useTranslation()
  const { sort, directionFor, toggle } = useTableSort<JobSortKey>({ key: 'createdAt', dir: 'desc' })

  const cellOf = useMemo(
    () =>
      (job: Job, key: JobSortKey): SortValue => {
        if (key === 'id') return job.id
        if (key === 'description') return job.description
        if (key === 'client') return clientName(job.clientId)
        if (key === 'status') return t(`jobs.status.${job.status}`)
        if (key === 'total') {
          const pricing = pricingOf(job.id)
          return pricing.complete ? pricing.total : undefined
        }
        if (key === 'dueDate') return job.effectiveDueDate()
        return job.createdAt
      },
    [clientName, pricingOf, t]
  )

  const sorted = useMemo(() => sortRows(rows, sort, cellOf, (job) => job.id), [rows, sort, cellOf])

  const statusItems = useMemo(
    () => JOB_STATUSES.map((status) => ({ key: status, label: t(`jobs.status.${status}`) })),
    [t]
  )

  return (
    <DataTable className={responsiveColumns}>
      <TableHead>
        <TableRow>
          <SortableColumnHeader
            label={t('jobs.colId')}
            direction={directionFor('id')}
            onToggle={(next) => toggle('id', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colDescription')}
            direction={directionFor('description')}
            onToggle={(next) => toggle('description', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colClient')}
            direction={directionFor('client')}
            onToggle={(next) => toggle('client', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colStatus')}
            direction={directionFor('status')}
            onToggle={(next) => toggle('status', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colTotal')}
            direction={directionFor('total')}
            onToggle={(next) => toggle('total', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colDueDate')}
            direction={directionFor('dueDate')}
            onToggle={(next) => toggle('dueDate', next)}
          />
          <SortableColumnHeader
            label={t('jobs.colCreated')}
            direction={directionFor('createdAt')}
            onToggle={(next) => toggle('createdAt', next)}
          />
          <TableHeader>{t('jobs.actions')}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.length === 0 ? (
          <TableEmptyRow colSpan={COLUMN_COUNT} message={emptyMessage} />
        ) : (
          sorted.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <TagTooltip tags={tagNames(job.id)} testId={`job-id-tooltip-${job.id}`}>
                  <Link
                    to={`/jobs/${job.id}`}
                    data-testid={`job-detail-link-${job.id}`}
                    aria-label={t('jobs.idLinkAria', { id: job.id })}
                    className="text-primary hover:underline"
                  >
                    {job.id}
                  </Link>
                </TagTooltip>
              </TableCell>
              <TableCell>
                {/* Plain text: the id column carries the navigation for this row. */}
                <TagTooltip tags={tagNames(job.id)} testId={`job-description-tooltip-${job.id}`}>
                  {job.description}
                </TagTooltip>
              </TableCell>
              <TableCell>
                <Link
                  to={`/clients/${job.clientId}`}
                  data-testid={`job-client-link-${job.id}`}
                  className="text-primary hover:underline"
                >
                  {clientName(job.clientId)}
                </Link>
              </TableCell>
              <TableCell>
                <div className="min-w-[9rem]" data-testid={`job-status-${job.id}`}>
                  <Combobox
                    items={statusItems}
                    value={job.status}
                    placeholder={t('jobs.statusFieldAria', { id: job.id })}
                    onChange={(next) => onStatusChange(job, next as JobStatus)}
                  />
                </div>
              </TableCell>
              <TableCell>
                <JobTotal pricing={pricingOf(job.id)} />
              </TableCell>
              <TableCell>
                <DueDateBadge job={job} clock={clock} />
              </TableCell>
              <TableCell className="text-text-muted">
                {job.createdAt !== '' && <RelativeTime value={job.createdAt} />}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    data-testid={`job-edit-${job.id}`}
                    onClick={() => onEdit(job)}
                  >
                    {t('jobs.editJob')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    data-testid={`job-archive-${job.id}`}
                    onClick={() => onArchive(job)}
                  >
                    {t('lifecycle.archive')}
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  )
}
