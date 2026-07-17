import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ColoredNumber } from '@/Component/ColoredNumber'
import { CreatePurchaseDialog } from '@/Component/detail/CreatePurchaseDialog'
import {
  TransactionsTable,
  type ConceptLink,
  type TransactionTableRow,
} from '@/Component/detail/TransactionsTable'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import type { Transaction } from '@/Entity/Transaction'
import { useEntityManager } from '@/Hook/useEntityManager'
import type { EntityManager } from '@/Repository/EntityManager'
import { calculateBalance, formatCurrency } from '@/Service/Pricing/money'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { transactionSearchBlob } from '@/Service/Search/searchBlobs'

/**
 * A concept links to whatever explains the money: the job that produced the
 * income, or the expense detail when the purchase actually bought stock.
 */
function conceptLinkFor(
  em: EntityManager,
  transaction: Transaction
): ConceptLink {
  if (transaction.refType === 'job')
    return { kind: 'job', to: `/jobs/${transaction.refId}` }
  if (
    transaction.isExpense() &&
    em.lots.findActiveByTransaction(transaction.id).length > 0
  ) {
    return { kind: 'expense', to: `/transactions/${transaction.id}` }
  }
  return { kind: 'none' }
}

export function TransactionsPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const transactions = useMemo(() => em.transactions.findActive(), [em])
  const balance = useMemo(() => calculateBalance(transactions), [transactions])

  const rows = useMemo<TransactionTableRow[]>(
    () =>
      transactions.map((transaction) => ({
        transaction,
        clientName:
          transaction.clientId === ''
            ? ''
            : (em.clients.find(transaction.clientId)?.name ?? ''),
        conceptLink: conceptLinkFor(em, transaction),
      })),
    [em, transactions]
  )

  const visible = useMemo(
    () =>
      fuzzyFilter(rows, query, (row) =>
        transactionSearchBlob(
          row.transaction,
          { clientLabel: row.clientName },
          t
        )
      ),
    [rows, query, t]
  )

  return (
    <div className="space-y-4">
      <ListTablePageHeader
        title={t('page.transactions')}
        search={<ListTableSearchField value={query} onChange={setQuery} />}
        actions={
          <>
            <span className="text-sm font-medium text-text-muted">
              {`${t('transactions.balance')}: `}
              <ColoredNumber value={balance}>
                {formatCurrency(balance)}
              </ColoredNumber>
            </span>
            <button
              type="button"
              data-testid="transactions-record-purchase"
              className="btn-primary"
              onClick={() => setDialogOpen(true)}
            >
              {t('purchase.recordButton')}
            </button>
          </>
        }
      />
      <TransactionsTable
        rows={visible}
        emptyMessage={
          rows.length === 0 ? t('transactions.empty') : t('listTable.noMatches')
        }
      />
      <CreatePurchaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(transactionId) => {
          void navigate(`/transactions/${transactionId}`)
        }}
      />
    </div>
  )
}
