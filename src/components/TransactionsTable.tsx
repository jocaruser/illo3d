import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Transaction } from '@/types/money'
import type { Client } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, type SortDirection } from '@/lib/listTable/sortDiscovery'
import { buildTransactionSearchBlob } from '@/lib/listTable/searchBlobs'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { SortableColumnHeader } from '@/components/list-table/SortableColumnHeader'
import { getTransactionConceptLink } from '@/lib/money/transactionConceptLink'

interface TransactionsTableProps {
  transactions: Transaction[]
  clients: Client[]
  /** Expense transactions that have at least one lot link to inventory. */
  expenseTxnIdsWithLots?: Set<string>
  /** First inventory id per expense transaction (from lots). */
  inventoryIdByExpenseTxnId?: Map<string, string>
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
  inventoryIdByExpenseTxnId: Map<string, string> | undefined
) {
  const text = tx.concept
  const link = getTransactionConceptLink(
    tx,
    expenseTxnIdsWithLots,
    inventoryIdByExpenseTxnId
  )
  if (!link) return text
  return (
    <Link
      to={link.to}
      data-testid={link.testId}
      className="text-blue-600 hover:text-blue-800"
    >
      {text}
    </Link>
  )
}

export function TransactionsTable({
  transactions,
  clients,
  expenseTxnIdsWithLots,
  inventoryIdByExpenseTxnId,
}: TransactionsTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
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
          <tbody className="divide-y divide-gray-200 bg-white">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-600">
                  {transactions.length === 0 ? null : t('listTable.noMatches')}
                </td>
              </tr>
            ) : (
              displayed.map((tx) => (
                <tr
                  key={tx.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {tx.date}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 sm:table-cell">
                    {t(`transactions.type.${tx.type}`)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 md:table-cell">
                    {tx.category}
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-700 lg:table-cell">
                    {conceptCell(tx, expenseTxnIdsWithLots, inventoryIdByExpenseTxnId)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-700 md:table-cell">
                    {tx.client_id ? (
                      <Link
                        to={`/clients/${tx.client_id}`}
                        data-testid={`transaction-client-link-${tx.client_id}`}
                        className="text-blue-600 hover:text-blue-800"
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
    </div>
  )
}
