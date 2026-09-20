import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ColourSwatch } from '@/Component/ColourSwatch'
import { RelativeTime } from '@/Component/RelativeTime'
import { cx } from '@/Component/cx'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableRow,
} from '@/Component/table/DataTable'
import { SortableColumnHeader } from '@/Component/table/SortableColumnHeader'
import type { InventoryItem, StockAlertLevel } from '@/Entity/InventoryItem'
import { formatCurrency } from '@/Service/Pricing/money'
import { sortRows, useTableSort, type SortValue } from './tableSort'

export interface InventoryTableRow {
  item: InventoryItem
  /** Weighted average over active lots; null when no lot qualifies. */
  avgUnitCost: number | null
}

interface InventoryTableProps {
  rows: InventoryTableRow[]
  emptyMessage: string
}

type SortKey = 'id' | 'name' | 'type' | 'qty' | 'avgUnitCost' | 'createdAt'

const COLUMN_COUNT = 6

/**
 * Threshold tints. Red is the danger token; the amber tiers use the palette
 * directly because the token set has one warning colour and these two tiers
 * must stay distinguishable at a glance.
 */
const alertClasses: Record<NonNullable<StockAlertLevel>, string> = {
  red: 'font-semibold text-danger',
  orange: 'font-semibold text-orange-600 dark:text-orange-400',
  yellow: 'font-semibold text-yellow-600 dark:text-yellow-400',
}

export function InventoryTable({ rows, emptyMessage }: InventoryTableProps) {
  const { t } = useTranslation()
  const { sort, directionFor, toggle } = useTableSort<SortKey>({
    key: 'id',
    dir: 'asc',
  })

  const sorted = useMemo(
    () =>
      sortRows(
        rows,
        sort,
        (row, key): SortValue => {
          switch (key) {
            case 'id':
              return row.item.id
            case 'name':
              return row.item.name
            case 'type':
              return t(`inventory.type.${row.item.type}`)
            case 'qty':
              return row.item.qtyCurrent
            case 'avgUnitCost':
              // An item with no lots has no cost to compare, so it sinks.
              return row.avgUnitCost ?? undefined
            case 'createdAt':
              return row.item.createdAt
          }
        },
        (row) => row.item.id
      ),
    [rows, sort, t]
  )

  const header = (key: SortKey, label: string, viewportTier?: 'small') => (
    <SortableColumnHeader
      label={label}
      direction={directionFor(key)}
      onToggle={(dir) => toggle(key, dir)}
      viewportTier={viewportTier ?? 'always'}
    />
  )

  return (
    <DataTable>
      <TableHead>
        <TableRow>
          {header('id', t('inventory.colId'))}
          {header('name', t('inventory.name'))}
          {header('type', t('inventory.typeLabel'), 'small')}
          {header('qty', t('inventory.qtyCurrent'))}
          {header('avgUnitCost', t('inventory.avgUnitCost'))}
          {header('createdAt', t('inventory.createdAt'))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.length === 0 ? (
          <TableEmptyRow colSpan={COLUMN_COUNT} message={emptyMessage} />
        ) : (
          sorted.map(({ item, avgUnitCost }) => {
            const alert = item.stockAlertLevel()
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    to={`/inventory/${item.id}`}
                    data-testid={`inventory-table-link-${item.id}`}
                    className="text-primary hover:underline"
                  >
                    {item.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <ColourSwatch colour={item.colour} />
                    {item.name}
                  </span>
                </TableCell>
                <TableCell viewportTier="small">{t(`inventory.type.${item.type}`)}</TableCell>
                <TableCell
                  className={cx(
                    'text-right',
                    alert !== null && alertClasses[alert]
                  )}
                >
                  {item.qtyCurrent}
                </TableCell>
                <TableCell className="text-right">
                  {avgUnitCost === null ? '—' : formatCurrency(avgUnitCost)}
                </TableCell>
                <TableCell>
                  <RelativeTime value={item.createdAt} />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </DataTable>
  )
}
