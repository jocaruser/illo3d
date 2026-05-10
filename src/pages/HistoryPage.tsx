import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useHistory } from '@/hooks/useHistory'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { buildHistorySearchBlob } from '@/lib/listTable/searchBlobs'
import { EmptyState } from '@/components/EmptyState'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'

export function HistoryPage() {
  const { t } = useTranslation()
  const { data: history = [], isLoading } = useHistory()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string>('changed_at')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(history, query, (h) =>
        buildHistorySearchBlob(h)
      ),
    [history, query]
  )

  const displayed = useMemo(
    () =>
      sortRowsByColumn(
        filtered,
        (h) => h.id,
        sortKey,
        sortDir,
        (h, key) => {
          switch (key) {
            case 'entity_type':
              return h.entity_type
            case 'entity_id':
              return h.entity_id
            case 'changed_at':
              return h.changed_at
            case 'changed_by':
              return h.changed_by
            default:
              return ''
          }
        }
      ),
    [filtered, sortKey, sortDir]
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-text">
          {t('history.title', 'History')}
        </h2>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('history.searchPlaceholder', 'Search by entity type, ID, or user...')}
          className="w-full max-w-md rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {history.length === 0 ? (
        <EmptyState messageKey="history.empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <SortableColumnHeader
                  columnKey="entity_type"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={onSortChange}
                  ariaLabel={sortAria(t('history.colEntityType', 'Type'), 'entity_type')}
                >
                  {t('history.colEntityType', 'Type')}
                </SortableColumnHeader>
                <SortableColumnHeader
                  columnKey="entity_id"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={onSortChange}
                  ariaLabel={sortAria(t('history.colEntityId', 'Entity ID'), 'entity_id')}
                >
                  {t('history.colEntityId', 'Entity ID')}
                </SortableColumnHeader>
                <SortableColumnHeader
                  columnKey="changed_at"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={onSortChange}
                  ariaLabel={sortAria(t('history.colChangedAt', 'When'), 'changed_at')}
                >
                  {t('history.colChangedAt', 'When')}
                </SortableColumnHeader>
                <SortableColumnHeader
                  columnKey="changed_by"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={onSortChange}
                  ariaLabel={sortAria(t('history.colChangedBy', 'Who'), 'changed_by')}
                >
                  {t('history.colChangedBy', 'Who')}
                </SortableColumnHeader>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('history.colAction', 'Action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface-elevated">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-muted">
                    {query
                      ? t('listTable.noMatches')
                      : t('history.empty')}
                  </td>
                </tr>
              ) : (
                displayed.map((entry) => (
                  <tr
                    key={entry.id}
                    className="odd:bg-surface-elevated even:bg-surface-alt hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                      <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text">
                        {entry.entity_type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                      {entry.entity_id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-muted">
                      {new Date(entry.changed_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-muted">
                      {entry.changed_by}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        to={`/history/${entry.id}`}
                        className="text-primary hover:text-blue-800"
                      >
                        {t('history.viewDetails', 'View')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
