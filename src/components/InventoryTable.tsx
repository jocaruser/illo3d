import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Inventory, Lot } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildInventorySearchBlob } from '@/lib/listTable/searchBlobs'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'
import { ColourSwatch } from '@/components/ColourSwatch'

function qtyThresholdHighlightClass(item: Inventory): string {
  const q = item.qty_current
  if (item.warn_red > 0 && q <= item.warn_red) return 'bg-red-100'
  if (item.warn_orange > 0 && q <= item.warn_orange) return 'bg-orange-100'
  if (item.warn_yellow > 0 && q <= item.warn_yellow) return 'bg-yellow-50'
  return ''
}

interface InventoryTableProps {
  items: Inventory[]
  /** Search query to filter rows. */
  query?: string
  lots: Lot[]
}

function avgUnitCost(items: Inventory, lots: Lot[]): number | null {
  return computeAvgUnitCost(lots.filter((l) => l.inventory_id === items.id))
}

function inventoryComparable(
  item: Inventory,
  key: string,
  ctx: { typeLabel: string; avg: number | null }
): string | number {
  switch (key) {
    case 'id':
      return item.id.toLowerCase()
    case 'name':
      return item.name.toLowerCase()
    case 'type':
      return ctx.typeLabel.toLowerCase()
    case 'qty_current':
      return item.qty_current
    case 'avg_cost':
      return ctx.avg ?? -1
    case 'created_at':
      return item.created_at
    default:
      return ''
  }
}

export function InventoryTable({ items, query = '', lots }: InventoryTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(items, query, (item) =>
        buildInventorySearchBlob(item, {
          typeLabel: t(`inventory.type.${item.type}`),
        })
      ),
    [items, query, t]
  )

  const displayed = useMemo(() => {
    if (sortKey === null) {
      return filtered
    }
    return sortRowsByColumn(
      filtered,
      (x) => x.id,
      sortKey,
      sortDir,
      (item, key) =>
        inventoryComparable(item, key, {
          typeLabel: t(`inventory.type.${item.type}`),
          avg: avgUnitCost(item, lots),
        })
    )
  }, [filtered, sortKey, sortDir, lots, t])

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
                ariaLabel={sortAria(t('inventory.name'), 'name')}
              >
                {t('inventory.name')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="type"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden sm:table-cell"
                ariaLabel={sortAria(t('inventory.typeLabel'), 'type')}
              >
                {t('inventory.typeLabel')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="qty_current"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('inventory.qtyCurrent'), 'qty_current')}
              >
                {t('inventory.qtyCurrent')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="avg_cost"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('inventory.avgUnitCost'), 'avg_cost')}
              >
                {t('inventory.avgUnitCost')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="created_at"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('inventory.createdAt'), 'created_at')}
              >
                {t('inventory.createdAt')}
              </SortableColumnHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                  {items.length === 0 ? t('inventory.empty') : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((item) => {
                const avg = avgUnitCost(item, lots)
                return (
                  <tr
                    key={item.id}
                    className="odd:bg-surface-elevated even:bg-surface-alt hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                      <Link
                        to={`/inventory/${item.id}`}
                        data-testid={`inventory-table-link-${item.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {item.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text">
                      <div className="flex items-center gap-2">
                        <ColourSwatch colour={item.colour} size="sm" />
                        {item.name}
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text sm:table-cell">
                      {t(`inventory.type.${item.type}`)}
                    </td>
                    <td
                      className={`hidden whitespace-nowrap px-4 py-3 text-right text-sm text-text md:table-cell ${qtyThresholdHighlightClass(item)}`}
                    >
                      {item.qty_current}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-text md:table-cell">
                      {avg == null ? '—' : formatCurrency(avg)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-text lg:table-cell">
                      {formatInventoryCreatedDate(item.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
  )
}
