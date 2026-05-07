import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client } from '@/types/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildClientSearchBlob } from '@/lib/listTable/searchBlobs'
import { LinkWithTagsTooltip } from '@/components/LinkWithTagsTooltip'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

interface ClientsTableProps {
  clients: Client[]
  /** Search query to filter rows. */
  query?: string
  /** Space-joined tag names per client id (for fuzzy search). */
  tagSearchLineByClientId?: ReadonlyMap<string, string>
  /** Comma-joined tag names per client id (for name link tooltip). */
  tagTitleByClientId?: ReadonlyMap<string, string>
  onEdit: (client: Client) => void
  onArchive: (client: Client) => void
}

function clientComparable(client: Client, key: string): string | number {
  switch (key) {
    case 'id':
      return client.id.toLowerCase()
    case 'name':
      return client.name.toLowerCase()
    case 'email':
      return (client.email ?? '').toLowerCase()
    case 'phone':
      return client.phone ?? ''
    case 'notes':
      return client.notes ?? ''
    case 'created_at':
      return client.created_at
    default:
      return ''
  }
}

export function ClientsTable({
  clients,
  query = '',
  tagSearchLineByClientId,
  tagTitleByClientId,
  onEdit,
  onArchive,
}: ClientsTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(clients, query, (c) =>
        buildClientSearchBlob(c, tagSearchLineByClientId?.get(c.id))
      ),
    [clients, query, tagSearchLineByClientId]
  )

  const displayed = useMemo(() => {
    if (sortKey === null) {
      return filtered
    }
    return sortRowsByColumn(
      filtered,
      (c) => c.id,
      sortKey,
      sortDir,
      clientComparable
    )
  }, [filtered, sortKey, sortDir])

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
                columnKey="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('clients.name'), 'name')}
              >
                {t('clients.name')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="email"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('clients.email'), 'email')}
              >
                {t('clients.email')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="phone"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('clients.phone'), 'phone')}
              >
                {t('clients.phone')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="notes"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('clients.notes'), 'notes')}
              >
                {t('clients.notes')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('clients.createdAt'), 'created_at')}
              >
                {t('clients.createdAt')}
              </SortableColumnHeader>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                {t('clients.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-text-muted">
                  {clients.length === 0 ? t('clients.empty') : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((client) => (
                <tr
                  key={client.id}
                  className="odd:bg-surface-elevated even:bg-surface-alt hover:bg-surface"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link
                      to={`/clients/${client.id}`}
                      data-testid={`client-detail-link-${client.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {client.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text">
                    <LinkWithTagsTooltip
                      label={client.name}
                      tagLine={tagTitleByClientId?.get(client.id)}
                      dataTestid={`client-name-tooltip-${client.id}`}
                      linkClassName="font-medium text-text"
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text md:table-cell">
                    {client.email ?? ''}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text md:table-cell">
                    {client.phone ?? ''}
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-text lg:table-cell">
                    {client.notes ?? ''}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text lg:table-cell">
                    {client.created_at}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => onEdit(client)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      {t('clients.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onArchive(client)}
                      className="text-amber-700 hover:text-amber-900"
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
