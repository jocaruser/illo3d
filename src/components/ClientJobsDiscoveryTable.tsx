import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildJobSearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

function embeddedJobComparable(job: Job, key: string, clientName: string): string | number {
  switch (key) {
    case 'id':
      return job.id.toLowerCase()
    case 'description':
      return job.description.toLowerCase()
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
      return clientName.toLowerCase()
  }
}

interface ClientJobsDiscoveryTableProps {
  jobs: Job[]
  /** Resolved client name for search blob (all rows share this client). */
  clientName: string
}

export function ClientJobsDiscoveryTable({
  jobs,
  clientName,
}: ClientJobsDiscoveryTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
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
        (j, key) => embeddedJobComparable(j, key, clientName)
      ),
    [filtered, sortKey, sortDir, clientName]
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
                thClassName="hidden md:table-cell"
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600">
                  {jobs.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((job) => (
                <tr
                  key={job.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {job.id}
                    </Link>
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 md:table-cell">
                    {job.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {t(`jobs.status.${job.status}`)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 lg:table-cell">
                    {formatJobPrice(job.price)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 lg:table-cell">
                    {job.created_at}
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
