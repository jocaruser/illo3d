import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { StatusDropdown } from './StatusDropdown'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildJobSearchBlob } from '@/lib/listTable/searchBlobs'
import { LinkWithTagsTooltip } from '@/components/LinkWithTagsTooltip'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function clientName(clients: Client[], clientId: string): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
}

function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

function jobComparable(job: Job, key: string, clients: Client[]): string | number {
  switch (key) {
    case 'client':
      return clientName(clients, job.client_id).toLowerCase()
    case 'description':
      return (job.description.trim() || job.id).toLowerCase()
    case 'status':
      return job.status
    case 'price':
      if (
        job.price === undefined ||
        job.price === null ||
        Number.isNaN(Number(job.price))
      ) {
        return Number.POSITIVE_INFINITY
      }
      return Number(job.price)
    case 'created_at':
      return job.created_at
    default:
      return ''
  }
}

interface JobsTableProps {
  jobs: Job[]
  clients: Client[]
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
  clients,
  tagTitleByJobId,
  tagSearchLineByJobId,
  onStatusSelect,
  onEdit,
  onArchive,
  statusUpdatingId,
}: JobsTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
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
        (j, key) => jobComparable(j, key, clients)
      ),
    [filtered, sortKey, sortDir, clients]
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
    <div>
      <ListTableSearchField
        value={query}
        onChange={setQuery}
        placeholder={t('listTable.searchPlaceholder')}
        ariaLabel={t('listTable.searchAria')}
      />
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                ariaLabel={sortAria(t('jobs.colPrice'), 'price')}
              >
                {t('jobs.colPrice')}
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
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600"
              >
                {t('jobs.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-600">
                  {jobs.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((job) => (
                <tr
                  key={job.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="max-w-xs truncate px-4 py-3 text-sm">
                    <LinkWithTagsTooltip
                      to={`/jobs/${job.id}`}
                      label={job.description.trim() || job.id}
                      tagLine={tagTitleByJobId?.get(job.id)}
                      dataTestid={`job-detail-link-${job.id}`}
                      linkAriaLabel={
                        job.description.trim()
                          ? undefined
                          : t('jobs.idLinkAria', { id: job.id })
                      }
                      linkClassName="font-medium text-blue-600 hover:text-blue-800"
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 md:table-cell">
                    <Link
                      to={`/clients/${job.client_id}`}
                      data-testid={`job-client-link-${job.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {clientName(clients, job.client_id)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    <StatusDropdown
                      jobId={job.id}
                      status={job.status}
                      disabled={statusUpdatingId === job.id}
                      onChange={(next) => onStatusSelect(job, next)}
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 lg:table-cell">
                    {formatJobPrice(job.price)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 lg:table-cell">
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
    </div>
  )
}
