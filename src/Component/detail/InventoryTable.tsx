import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ColourSwatch } from '@/Component/ColourSwatch'
import { RelativeTime } from '@/Component/RelativeTime'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableRow,
} from '@/Component/table/DataTable'
import { SortableColumnHeader } from '@/Component/table/SortableColumnHeader'
import { cx } from '@/Component/cx'
import type { InventoryItem, StockAlertLevel } from '@/Entity/InventoryItem'
import { formatCurrency } from '@/Service/Pricing/money'

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

interface SortState {
  key: SortKey
  direction: 'asc' | 'desc'
}

const COLUMN_COUNT = 6

/**
 * The Type column collapses below `sm`. Driven from the table element so both
 * the header and every cell hide together without forking the shared table
 * primitives.
 */
const responsiveColumns = '[&_tr>*:nth-child(3)]:hidden sm:[&_tr>*:nth-child(3)]:table-cell'

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

function sortValue(row: InventoryTableRow, key: SortKey, typeLabel: string): string | number {
  switch (key) {
    case 'id':
      return row.item.id
    case 'name':
      return row.item.name
    case 'type':
      return typeLabel
    case 'qty':
      return row.item.qtyCurrent
    case 'avgUnitCost':
      // Items without lots sort as the cheapest; they are the ones to price.
      return row.avgUnitCost ?? -1
    case 'createdAt':
      return row.item.createdAt
  }
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

export function InventoryTable({ rows, emptyMessage }: InventoryTableProps) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<SortState>({ key: 'id', direction: 'asc' })

  const sorted = useMemo(() => {
    const typeLabel = (row: InventoryTableRow) => t(`inventory.type.${row.item.type}`)
    return [...rows].sort((a, b) => {
      const result = compare(
        sortValue(a, sort.key, typeLabel(a)),
        sortValue(b, sort.key, typeLabel(b))
      )
      return sort.direction === 'asc' ? result : -result
    })
  }, [rows, sort, t])

  const header = (key: SortKey, label: string) => (
    <SortableColumnHeader
      label={label}
      direction={sort.key === key ? sort.direction : null}
      onToggle={(direction) => setSort({ key, direction })}
    />
  )

  return (
    <DataTable className={responsiveColumns}>
      <TableHead>
        <TableRow>
          {header('id', t('inventory.colId'))}
          {header('name', t('inventory.name'))}
          {header('type', t('inventory.typeLabel'))}
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
                <TableCell>{t(`inventory.type.${item.type}`)}</TableCell>
                <TableCell className={cx('text-right', alert !== null && alertClasses[alert])}>
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
