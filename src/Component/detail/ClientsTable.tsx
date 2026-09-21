import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import type { Client } from '@/Entity/Client'
import { TagTooltip } from './TagTooltip'
import { sortRows, useTableSort, type SortValue } from './tableSort'

export type ClientSortKey = 'id' | 'name' | 'email' | 'phone' | 'notes' | 'createdAt'

interface ClientsTableProps {
  rows: Client[]
  /** Tag names for a client, shown as the name-cell tooltip. */
  tagNames: (clientId: string) => string[]
  /** Shown in-table when `rows` is empty. */
  emptyMessage: string
  onEdit: (client: Client) => void
  onArchive: (client: Client) => void
}

const COLUMN_COUNT = 7

function cellOf(client: Client, key: ClientSortKey): SortValue {
  if (key === 'id') return client.id
  if (key === 'name') return client.name
  if (key === 'email') return client.email
  if (key === 'phone') return client.phone
  if (key === 'notes') return client.notes
  return client.createdAt
}

export function ClientsTable({ rows, tagNames, emptyMessage, onEdit, onArchive }: ClientsTableProps) {
  const { t } = useTranslation()
  const { sort, directionFor, toggle } = useTableSort<ClientSortKey>({ key: 'id', dir: 'asc' })
  const sorted = useMemo(() => sortRows(rows, sort, cellOf, (client) => client.id), [rows, sort])

  return (
    <DataTable>
      <TableHead>
        <TableRow>
          <SortableColumnHeader
            label={t('clients.id')}
            direction={directionFor('id')}
            onToggle={(next) => toggle('id', next)}
          />
          <SortableColumnHeader
            label={t('clients.name')}
            direction={directionFor('name')}
            onToggle={(next) => toggle('name', next)}
          />
          <SortableColumnHeader
            label={t('clients.email')}
            direction={directionFor('email')}
            onToggle={(next) => toggle('email', next)}
          />
          <SortableColumnHeader
            label={t('clients.phone')}
            direction={directionFor('phone')}
            onToggle={(next) => toggle('phone', next)}
            viewportTier="medium"
          />
          <SortableColumnHeader
            label={t('clients.notes')}
            direction={directionFor('notes')}
            onToggle={(next) => toggle('notes', next)}
          />
          <SortableColumnHeader
            label={t('clients.createdAt')}
            direction={directionFor('createdAt')}
            onToggle={(next) => toggle('createdAt', next)}
            viewportTier="wide"
          />
          <TableHeader>{t('clients.actions')}</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.length === 0 ? (
          <TableEmptyRow colSpan={COLUMN_COUNT} message={emptyMessage} />
        ) : (
          sorted.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  to={`/clients/${client.id}`}
                  data-testid={`client-detail-link-${client.id}`}
                  className="text-primary hover:underline"
                >
                  {client.id}
                </Link>
              </TableCell>
              <TableCell>
                <TagTooltip tags={tagNames(client.id)} testId={`client-name-tooltip-${client.id}`}>
                  {client.name}
                </TagTooltip>
              </TableCell>
              <TableCell className="text-text-muted">{client.email}</TableCell>
              <TableCell viewportTier="medium" className="text-text-muted">
                {client.phone}
              </TableCell>
              <TableCell className="max-w-xs truncate text-text-muted">{client.notes}</TableCell>
              <TableCell viewportTier="wide" className="text-text-muted">
                {client.createdAt !== '' && <RelativeTime value={client.createdAt} />}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    data-testid={`client-edit-${client.id}`}
                    onClick={() => onEdit(client)}
                  >
                    {t('clients.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    data-testid={`client-archive-${client.id}`}
                    onClick={() => onArchive(client)}
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
