import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Inventory, Lot } from '@/types/money'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildInventorySearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

function qtyThresholdHighlightClass(item: Inventory): string {
  const q = item.qty_current
  if (item.warn_red > 0 && q <= item.warn_red) return 'bg-red-100'
  if (item.warn_orange > 0 && q <= item.warn_orange) return 'bg-orange-100'
  if (item.warn_yellow > 0 && q <= item.warn_yellow) return 'bg-yellow-50'
  return ''
}

interface InventoryTableProps {
  items: Inventory[]
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

export function InventoryTable({ items, lots }: InventoryTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
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
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600">
                  {items.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((item) => {
                const avg = avgUnitCost(item, lots)
                return (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {item.name}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:table-cell">
                      {t(`inventory.type.${item.type}`)}
                    </td>
                    <td
                      className={`hidden whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 md:table-cell ${qtyThresholdHighlightClass(item)}`}
                    >
                      {item.qty_current}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 md:table-cell">
                      {avg == null ? '—' : formatCurrency(avg)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 lg:table-cell">
                      {formatInventoryCreatedDate(item.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
