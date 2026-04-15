import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client } from '@/types/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildClientSearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

interface ClientsTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function clientComparable(client: Client, key: string): string | number {
  switch (key) {
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

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const filtered = useMemo(
    () => filterRowsBySearchQuery(clients, query, buildClientSearchBlob),
    [clients, query]
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
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600"
              >
                {t('clients.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-600">
                  {clients.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((client) => (
                <tr
                  key={client.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    <Link
                      to={`/clients/${client.id}`}
                      data-testid={`client-detail-link-${client.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 md:table-cell">
                    {client.email ?? ''}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 md:table-cell">
                    {client.phone ?? ''}
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 lg:table-cell">
                    {client.notes ?? ''}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 lg:table-cell">
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
                      onClick={() => onDelete(client)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('clients.delete')}
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
