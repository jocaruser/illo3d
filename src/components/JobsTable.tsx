import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, Job, Piece } from '@/types/money'
import { jobTotalSortValue } from '@/utils/jobPiecePricing'
import { JobPricingTotalDisplay } from '@/components/JobPricingTotalDisplay'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { Combobox } from './Combobox'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildJobSearchBlob } from '@/lib/listTable/searchBlobs'
import { LinkWithTagsTooltip } from '@/components/LinkWithTagsTooltip'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function clientName(clients: Client[], clientId: string): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
}

function jobComparable(
  job: Job,
  key: string,
  clients: Client[],
  pieces: Piece[]
): string | number {
  switch (key) {
    case 'id':
      return job.id.toLowerCase()
    case 'client':
      return clientName(clients, job.client_id).toLowerCase()
    case 'description':
      return (job.description.trim() || job.id).toLowerCase()
    case 'status':
      return job.status
    case 'price':
      return jobTotalSortValue(job.id, pieces)
    case 'due_date':
      return jobDueDateGradient(job).days
    case 'created_at':
      return job.created_at
    default:
      return ''
  }
}

interface JobsTableProps {
  jobs: Job[]
  pieces: Piece[]
  clients: Client[]
  /** Search query to filter rows. */
  query?: string
  /** Comma-joined tag names per job id (for job id link tooltip). */
  tagTitleByJobId?: ReadonlyMap<string, string>
  /** Space-joined tag names per job id (for fuzzy search). */
  tagSearchLineByJobId?: ReadonlyMap<string, string>
  onStatusSelect: (job: Job, nextStatus: Job['status']) => void
  onEdit: (job: Job) => void
  onArchive: (job: Job) => void
  statusUpdatingId: string | null
}

export function JobsTable({
  jobs,
  pieces,
  clients,
  query = '',
  tagTitleByJobId,
  tagSearchLineByJobId,
  onStatusSelect,
  onEdit,
  onArchive,
  statusUpdatingId,
}: JobsTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(jobs, query, (job) =>
        buildJobSearchBlob(job, {
          clientName: clientName(clients, job.client_id),
          statusLabel: t(`jobs.status.${job.status}`),
          tagNamesSearchLine: tagSearchLineByJobId?.get(job.id),
        })
      ),
    [jobs, query, clients, t, tagSearchLineByJobId]
  )

  const displayed = useMemo(
    () =>
      sortRowsByColumn(
        filtered,
        (j) => j.id,
        sortKey,
        sortDir,
        (j, key) => jobComparable(j, key, clients, pieces)
      ),
    [filtered, sortKey, sortDir, clients, pieces]
  )

  const onSortChange = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortAria = (columnLabel: string, key: string) => {
    const active = sortKey === key
    if (!active) {
      return t('listTable.sortBy', { column: columnLabel })
    }
    return sortDir === 'asc'
      ? t('listTable.sortedAscending', { column: columnLabel })
      : t('listTable.sortedDescending', { column: columnLabel })
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <SortableColumnHeader
                columnKey="id"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('jobs.colId'), 'id')}
              >
                {t('jobs.colId')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="description"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('jobs.colDescription'), 'description')}
              >
                {t('jobs.colDescription')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="client"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('jobs.colClient'), 'client')}
              >
                {t('jobs.colClient')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('jobs.colStatus'), 'status')}
              >
                {t('jobs.colStatus')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="price"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('jobs.colTotal'), 'price')}
              >
                {t('jobs.colTotal')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="due_date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('jobs.widgetDueDate'), 'due_date')}
              >
                {t('jobs.widgetDueDate')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('jobs.colCreated'), 'created_at')}
              >
                {t('jobs.colCreated')}
              </SortableColumnHeader>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                {t('jobs.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-text-muted">
                  {jobs.length === 0 ? t('jobs.empty') : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((job) => (
                <tr
                  key={job.id}
                  className="odd:bg-surface-elevated even:bg-surface-alt hover:bg-surface"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link
                      to={`/jobs/${job.id}`}
                      data-testid={`job-detail-link-${job.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {job.id}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm">
                    <LinkWithTagsTooltip
                      label={job.description.trim() || job.id}
                      tagLine={tagTitleByJobId?.get(job.id)}
                      dataTestid={`job-description-tooltip-${job.id}`}
                      linkAriaLabel={
                        job.description.trim()
                          ? undefined
                          : t('jobs.idLinkAria', { id: job.id })
                      }
                      linkClassName="font-medium text-text"
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text md:table-cell">
                    <Link
                      to={`/clients/${job.client_id}`}
                      data-testid={`job-client-link-${job.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {clientName(clients, job.client_id)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                    <Combobox
                      items={['draft', 'in_progress', 'delivered', 'paid', 'cancelled'] as const}
                      value={job.status}
                      onChange={(key) => onStatusSelect(job, key as Job['status'])}
                      getKey={(s) => s}
                      getLabel={(s) => t(`jobs.status.${s}`)}
                      disabled={statusUpdatingId === job.id}
                      id={`job-status-${job.id}`}
                      ariaLabel={t('jobs.statusFieldAria', { id: job.id })}
                      searchable={false}
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-text lg:table-cell">
                    <JobPricingTotalDisplay
                      jobId={job.id}
                      pieces={pieces}
                      t={t}
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm lg:table-cell">
                    {(() => {
                      const due = jobDueDateGradient(job)
                      return (
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${due.bgClass} ${due.textClass}`}>
                          {due.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text lg:table-cell">
                    {job.created_at}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      data-testid={`job-edit-${job.id}`}
                      onClick={() => onEdit(job)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      {t('jobs.editJob')}
                    </button>
                    <button
                      type="button"
                      data-testid={`job-archive-${job.id}`}
                      onClick={() => onArchive(job)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('lifecycle.archive')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  )
}
