import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Transaction } from '@/types/money'
import type { Client } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildTransactionSearchBlob } from '@/lib/listTable/searchBlobs'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'
import { getTransactionConceptLink } from '@/lib/money/transactionConceptLink'

interface TransactionsTableProps {
  transactions: Transaction[]
  /** Search query to filter rows. */
  query?: string
  clients: Client[]
  /** Expense transactions that have at least one lot link to inventory. */
  expenseTxnIdsWithLots?: Set<string>
}

function getClientName(clients: Client[], clientId?: string): string {
  if (!clientId) return ''
  const client = clients.find((c) => c.id === clientId)
  return client?.name ?? ''
}

function transactionComparable(
  tx: Transaction,
  key: string,
  ctx: { typeLabel: string; clientLabel: string }
): string | number {
  switch (key) {
    case 'date':
      return tx.date
    case 'type':
      return ctx.typeLabel.toLowerCase()
    case 'amount':
      return tx.amount
    case 'category':
      return tx.category.toLowerCase()
    case 'concept':
      return tx.concept.toLowerCase()
    case 'client':
      return ctx.clientLabel.toLowerCase()
    default:
      return ''
  }
}

function conceptCell(
  tx: Transaction,
  expenseTxnIdsWithLots: Set<string> | undefined,
) {
  const text = tx.concept
  const link = getTransactionConceptLink(tx, expenseTxnIdsWithLots)
  if (!link) return text
  return (
    <Link
      to={link.to}
      data-testid={link.testId}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
    >
      {text}
    </Link>
  )
}

export function TransactionsTable({
  transactions,
  query = '',
  clients,
  expenseTxnIdsWithLots,
}: TransactionsTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const filtered = useMemo(
    () =>
      filterRowsBySearchQuery(transactions, query, (tx) =>
        buildTransactionSearchBlob(tx, {
          typeLabel: t(`transactions.type.${tx.type}`),
          clientLabel:
            getClientName(clients, tx.client_id) || (tx.client_id ?? ''),
        })
      ),
    [transactions, query, clients, t]
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
      (tx, key) =>
        transactionComparable(tx, key, {
          typeLabel: t(`transactions.type.${tx.type}`),
          clientLabel:
            getClientName(clients, tx.client_id) || (tx.client_id ?? ''),
        })
    )
  }, [filtered, sortKey, sortDir, clients, t])

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
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('jobs.colId')}
              </th>
              <SortableColumnHeader
                columnKey="date"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                ariaLabel={sortAria(t('transactions.date'), 'date')}
              >
                {t('transactions.date')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="type"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden sm:table-cell"
                ariaLabel={sortAria(t('transactions.type'), 'type')}
              >
                {t('transactions.type')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="amount"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                alignEnd
                ariaLabel={sortAria(t('transactions.amount'), 'amount')}
              >
                {t('transactions.amount')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="category"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('transactions.category'), 'category')}
              >
                {t('transactions.category')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="concept"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden lg:table-cell"
                ariaLabel={sortAria(t('transactions.concept'), 'concept')}
              >
                {t('transactions.concept')}
              </SortableColumnHeader>
              <SortableColumnHeader
                columnKey="client"
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={onSortChange}
                thClassName="hidden md:table-cell"
                ariaLabel={sortAria(t('transactions.client'), 'client')}
              >
                {t('transactions.client')}
              </SortableColumnHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  {transactions.length === 0 ? t('transactions.empty') : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((tx) => (
                <tr
                  key={tx.id}
                  className="odd:bg-white dark:bg-gray-900 even:bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {tx.type === 'expense' ? (
                      <Link
                        to={`/transactions/${tx.id}`}
                        data-testid={`transaction-expense-detail-link-${tx.id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                      >
                        {tx.id}
                      </Link>
                    ) : (
                      tx.id
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {tx.date}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300 sm:table-cell">
                    {t(`transactions.type.${tx.type}`)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${
                      tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300 md:table-cell">
                    {tx.category}
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 dark:text-gray-300 lg:table-cell">
                    {conceptCell(tx, expenseTxnIdsWithLots)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300 md:table-cell">
                    {tx.client_id ? (
                      <Link
                        to={`/clients/${tx.client_id}`}
                        data-testid={`transaction-client-link-${tx.client_id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                      >
                        {getClientName(clients, tx.client_id) || tx.client_id}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  )
}
