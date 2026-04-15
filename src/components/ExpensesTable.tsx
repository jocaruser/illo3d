import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Expense } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildExpenseSearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'

interface ExpensesTableProps {
  expenses: Expense[]
  inventoryByExpenseId?: Map<string, string>
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

function expenseComparable(
  exp: Expense,
  key: string,
  ctx: { categoryLabel: string; inventoryId?: string }
): string | number {
  switch (key) {
    case 'date':
      return exp.date
    case 'category':
      return ctx.categoryLabel.toLowerCase()
    case 'amount':
      return exp.amount
    case 'notes':
      return exp.notes ?? ''
    case 'inventory':
      return ctx.inventoryId ?? ''
    default:
      return ''
  }
}

export function ExpensesTable({
  expenses,
  inventoryByExpenseId,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(expenses, query, (exp) =>
        buildExpenseSearchBlob(exp, {
          categoryLabel: t(`expenses.category.${exp.category}`),
        })
      ),
    [expenses, query, t]
  )

  const displayed = useMemo(() => {
    if (sortKey === null) {
      return filtered
    }
    return sortRowsByColumn(
      filtered,
      (e) => e.id,
      sortKey,
      sortDir,
      (e, key) =>
        expenseComparable(e, key, {
          categoryLabel: t(`expenses.category.${e.category}`),
          inventoryId: inventoryByExpenseId?.get(e.id),
        })
    )
  }, [filtered, sortKey, sortDir, inventoryByExpenseId, t])

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
                columnKey="date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('expenses.date'), 'date')}
              >
                {t('expenses.date')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="category"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden sm:table-cell"
                ariaLabel={sortAria(t('expenses.category'), 'category')}
              >
                {t('expenses.category')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="amount"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('expenses.amount'), 'amount')}
              >
                {t('expenses.amount')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="notes"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('expenses.notes'), 'notes')}
              >
                {t('expenses.notes')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="inventory"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('inventory.expenseColumn'), 'inventory')}
              >
                {t('inventory.expenseColumn')}
              </SortableColumnHeader>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600"
              >
                {t('expenses.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-600">
                  {expenses.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((exp) => (
                <tr
                  key={exp.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {exp.date}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:table-cell">
                    {t(`expenses.category.${exp.category}`)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-red-600 md:table-cell">
                    {formatCurrency(-exp.amount)}
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 lg:table-cell">
                    {exp.notes ?? ''}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm lg:table-cell">
                    {inventoryByExpenseId?.has(exp.id) ? (
                      <Link
                        to="/inventory"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {t('inventory.linkLabel')}
                      </Link>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => onEdit(exp)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      {t('expenses.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(exp)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('expenses.delete')}
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
