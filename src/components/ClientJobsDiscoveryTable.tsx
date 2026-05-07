import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Job, Piece } from '@/types/money'
import { jobTotalSortValue } from '@/utils/jobPiecePricing'
import { JobPricingTotalDisplay } from '@/components/JobPricingTotalDisplay'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildJobSearchBlob } from '@/lib/listTable/searchBlobs'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function embeddedJobComparable(
  job: Job,
  key: string,
  clientName: string,
  pieces: Piece[],
): string | number {
  switch (key) {
    case 'id':
      return job.id.toLowerCase()
    case 'description':
      return (job.description.trim() || job.id).toLowerCase()
    case 'status':
      return job.status
    case 'price':
      return jobTotalSortValue(job.id, pieces)
    case 'created_at':
      return job.created_at
    default:
      return clientName.toLowerCase()
  }
}

interface ClientJobsDiscoveryTableProps {
  jobs: Job[]
  /** Search query to filter rows. */
  query?: string
  pieces: Piece[]
  /** Resolved client name for search blob (all rows share this client). */
  clientName: string
}

export function ClientJobsDiscoveryTable({
  jobs,
  query = '',
  pieces,
  clientName,
}: ClientJobsDiscoveryTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(jobs, query, (job) =>
        buildJobSearchBlob(job, {
          clientName,
          statusLabel: t(`jobs.status.${job.status}`),
        })
      ),
    [jobs, query, clientName, t]
  )

  const displayed = useMemo(
    () =>
      sortRowsByColumn(
        filtered,
        (j) => j.id,
        sortKey,
        sortDir,
        (j, key) => embeddedJobComparable(j, key, clientName, pieces)
      ),
    [filtered, sortKey, sortDir, clientName, pieces]
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
                columnKey="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('jobs.colCreated'), 'created_at')}
              >
                {t('jobs.colCreated')}
              </SortableColumnHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-muted">
                  {jobs.length === 0 ? t('clientDetail.jobsEmpty') : t('listTable.noMatches')}
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
                      className="font-medium text-primary hover:text-blue-800 dark:text-blue-200"
                    >
                      {job.id}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm font-medium text-text">
                    {job.description.trim() || job.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                    {t(`jobs.status.${job.status}`)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-text lg:table-cell">
                    <JobPricingTotalDisplay
                      jobId={job.id}
                      pieces={pieces}
                      t={t}
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text lg:table-cell">
                    {job.created_at}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  )
}
