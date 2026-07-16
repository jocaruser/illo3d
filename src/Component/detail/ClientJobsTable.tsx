import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import type { Job } from '@/Entity/Job'
import { sortRows, useTableSort, type SortValue } from './tableSort'

export type ClientJobSortKey = 'id' | 'description' | 'status' | 'dueDate' | 'createdAt'

interface ClientJobsTableProps {
  /** All of the client's jobs — archived and soft-deleted rows included. */
  rows: Job[]
  emptyMessage: string
  onEdit: (job: Job) => void
  onArchive: (job: Job) => void
  onUnarchive: (job: Job) => void
}

const COLUMN_COUNT = 6

/** Due date (4th) appears at md, Created (5th) at lg. */
const responsiveColumns = cx(
  '[&_tr>*:nth-child(4)]:hidden md:[&_tr>*:nth-child(4)]:table-cell',
  '[&_tr>*:nth-child(5)]:hidden lg:[&_tr>*:nth-child(5)]:table-cell'
)

function cellOf(job: Job, key: ClientJobSortKey): SortValue {
  if (key === 'id') return job.id
  if (key === 'description') return job.description
  if (key === 'status') return job.status
  if (key === 'dueDate') return job.effectiveDueDate()
  return job.createdAt
}

/**
 * The client detail jobs table. Unlike the jobs list it keeps archived rows
 * (struck through, offering Un-archive instead of Edit) and soft-deleted rows
 * (struck through, labelled as a deleted entity) visible for context.
 */
export function ClientJobsTable({
  rows,
  emptyMessage,
  onEdit,
  onArchive,
  onUnarchive,
}: ClientJobsTableProps) {
  const { t } = useTranslation()
  const { sort, directionFor, toggle } = useTableSort<ClientJobSortKey>({
    key: 'createdAt',
    dir: 'desc',
  })
  const sorted = useMemo(() => sortRows(rows, sort, cellOf, (job) => job.id), [rows, sort])

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
            label={t('jobs.colStatus')}
            direction={directionFor('status')}
            onToggle={(next) => toggle('status', next)}
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
          sorted.map((job) => {
            const inactive = !job.isActive()
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <Link
                    to={`/jobs/${job.id}`}
                    data-testid={`client-job-link-${job.id}`}
                    className={cx('text-primary hover:underline', inactive && 'line-through')}
                  >
                    {job.id}
                  </Link>
                </TableCell>
                <TableCell className={cx(inactive && 'text-text-muted line-through')}>
                  {job.description}
                </TableCell>
                <TableCell className={cx('text-text-muted', inactive && 'line-through')}>
                  {t(`jobs.status.${job.status}`)}
                </TableCell>
                <TableCell className={cx('text-text-muted', inactive && 'line-through')}>
                  {job.effectiveDueDate().slice(0, 10)}
                </TableCell>
                <TableCell className={cx('text-text-muted', inactive && 'line-through')}>
                  {job.createdAt !== '' && <RelativeTime value={job.createdAt} />}
                </TableCell>
                <TableCell>
                  <ClientJobActions
                    job={job}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                  />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </DataTable>
  )
}

interface ClientJobActionsProps {
  job: Job
  onEdit: (job: Job) => void
  onArchive: (job: Job) => void
  onUnarchive: (job: Job) => void
}

function ClientJobActions({ job, onEdit, onArchive, onUnarchive }: ClientJobActionsProps) {
  const { t } = useTranslation()

  if (job.isDeleted()) {
    return (
      <span
        data-testid={`client-job-deleted-${job.id}`}
        className="text-xs font-medium uppercase tracking-wider text-text-muted"
      >
        {t('lifecycle.deletedEntity')}
      </span>
    )
  }

  if (job.isArchived()) {
    return (
      <button
        type="button"
        className="btn-secondary px-2 py-1 text-xs"
        data-testid={`client-job-unarchive-${job.id}`}
        onClick={() => onUnarchive(job)}
      >
        {t('lifecycle.unarchive')}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-secondary px-2 py-1 text-xs"
        data-testid={`client-job-edit-${job.id}`}
        onClick={() => onEdit(job)}
      >
        {t('jobs.editJob')}
      </button>
      <button
        type="button"
        className="btn-secondary px-2 py-1 text-xs"
        data-testid={`client-job-archive-${job.id}`}
        onClick={() => onArchive(job)}
      >
        {t('lifecycle.archive')}
      </button>
    </div>
  )
}
