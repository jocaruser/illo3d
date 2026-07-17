import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ColouredNumber } from '@/Component/ColouredNumber'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableRow,
} from '@/Component/table/DataTable'
import { SortableColumnHeader } from '@/Component/table/SortableColumnHeader'
import type { Transaction } from '@/Entity/Transaction'
import { formatCurrency } from '@/Service/Pricing/money'
import { sortRows, useTableSort, type SortValue } from './tableSort'

/** Where a row's concept points, decided by the page from the workbook. */
export type ConceptLink =
  | { kind: 'job'; to: string }
  | { kind: 'expense'; to: string }
  | { kind: 'none' }

export interface TransactionTableRow {
  transaction: Transaction
  /** '' when the row has no client or the client no longer resolves. */
  clientName: string
  conceptLink: ConceptLink
}

interface TransactionsTableProps {
  rows: TransactionTableRow[]
  emptyMessage: string
}

type SortKey =
  'id' | 'date' | 'type' | 'amount' | 'category' | 'concept' | 'client'

const COLUMN_COUNT = 7

/**
 * Columns drop as the viewport narrows, keeping id/date/amount — the three a
 * user scans for. Driven from the table element so headers and cells hide
 * together without forking the shared table primitives.
 */
const responsiveColumns = [
  '[&_tr>*:nth-child(3)]:hidden sm:[&_tr>*:nth-child(3)]:table-cell',
  '[&_tr>*:nth-child(5)]:hidden md:[&_tr>*:nth-child(5)]:table-cell',
  '[&_tr>*:nth-child(6)]:hidden lg:[&_tr>*:nth-child(6)]:table-cell',
  '[&_tr>*:nth-child(7)]:hidden md:[&_tr>*:nth-child(7)]:table-cell',
].join(' ')

/** Read-only: transactions are edited on the expense detail page, never in the list. */
export function TransactionsTable({
  rows,
  emptyMessage,
}: TransactionsTableProps) {
  const { t } = useTranslation()
  const { sort, directionFor, toggle } = useTableSort<SortKey>({
    key: 'date',
    dir: 'desc',
  })

  const sorted = useMemo(
    () =>
      sortRows(
        rows,
        sort,
        (row, key): SortValue => {
          switch (key) {
            case 'id':
              return row.transaction.id
            case 'date':
              return row.transaction.date
            case 'type':
              return t(`transactions.type.${row.transaction.type}`)
            case 'amount':
              return row.transaction.amount ?? 0
            case 'category':
              return row.transaction.category
            case 'concept':
              return row.transaction.concept
            case 'client':
              return row.clientName
          }
        },
        (row) => row.transaction.id
      ),
    [rows, sort, t]
  )

  const header = (key: SortKey, label: string) => (
    <SortableColumnHeader
      label={label}
      direction={directionFor(key)}
      onToggle={(dir) => toggle(key, dir)}
    />
  )

  return (
    <DataTable className={responsiveColumns}>
      <TableHead>
        <TableRow>
          {header('id', t('transactions.colId'))}
          {header('date', t('transactions.date'))}
          {header('type', t('transactions.type'))}
          {header('amount', t('transactions.amount'))}
          {header('category', t('transactions.category'))}
          {header('concept', t('transactions.concept'))}
          {header('client', t('transactions.client'))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.length === 0 ? (
          <TableEmptyRow colSpan={COLUMN_COUNT} message={emptyMessage} />
        ) : (
          sorted.map(({ transaction, clientName, conceptLink }) => {
            const amount = transaction.amount ?? 0
            return (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {transaction.isExpense() ? (
                    <Link
                      to={`/transactions/${transaction.id}`}
                      data-testid={`transaction-expense-detail-link-${transaction.id}`}
                      className="text-primary hover:underline"
                    >
                      {transaction.id}
                    </Link>
                  ) : (
                    transaction.id
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {transaction.date}
                </TableCell>
                <TableCell>
                  {t(`transactions.type.${transaction.type}`)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <ColouredNumber
                    value={amount}
                    forceRed={transaction.isExpense()}
                  >
                    {formatCurrency(amount)}
                  </ColouredNumber>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>
                  <ConceptCell
                    transaction={transaction}
                    conceptLink={conceptLink}
                  />
                </TableCell>
                <TableCell>
                  {transaction.clientId === '' || clientName === '' ? (
                    clientName
                  ) : (
                    <Link
                      to={`/clients/${transaction.clientId}`}
                      data-testid={`transaction-client-link-${transaction.id}`}
                      className="text-primary hover:underline"
                    >
                      {clientName}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </DataTable>
  )
}

interface ConceptCellProps {
  transaction: Transaction
  conceptLink: ConceptLink
}

function ConceptCell({ transaction, conceptLink }: ConceptCellProps) {
  if (conceptLink.kind === 'job') {
    return (
      <Link
        to={conceptLink.to}
        data-testid={`transaction-concept-job-link-${transaction.id}`}
        className="text-primary hover:underline"
      >
        {transaction.concept}
      </Link>
    )
  }
  if (conceptLink.kind === 'expense') {
    return (
      <Link
        to={conceptLink.to}
        data-testid={`transaction-concept-expense-detail-link-${transaction.id}`}
        className="text-primary hover:underline"
      >
        {transaction.concept}
      </Link>
    )
  }
  return <>{transaction.concept}</>
}
