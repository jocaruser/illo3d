import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ColouredNumber } from '@/Component/ColouredNumber'
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
import { useListTableDiscovery } from '@/Hook/useListTableDiscovery'
import type { EntityManager } from '@/Repository/EntityManager'
import { calculateBalance, formatCurrency } from '@/Service/Pricing/money'
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

  const getSearchBlob = useCallback(
    (row: TransactionTableRow) =>
      transactionSearchBlob(
        row.transaction,
        { clientLabel: row.clientName },
        t
      ),
    [t]
  )

  const {
    query,
    setQuery,
    rows: visible,
    emptyMessage,
  } = useListTableDiscovery({
    sourceRows: rows,
    getSearchBlob,
    messages: {
      collectionEmpty: t('transactions.empty'),
      noMatches: t('listTable.noMatches'),
    },
  })

  return (
    <div className="space-y-4">
      <ListTablePageHeader
        title={t('page.transactions')}
        search={<ListTableSearchField value={query} onChange={setQuery} />}
        actions={
          <>
            <span className="text-sm font-medium text-text-muted">
              {`${t('transactions.balance')}: `}
              <ColouredNumber value={balance}>
                {formatCurrency(balance)}
              </ColouredNumber>
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
      <TransactionsTable rows={visible} emptyMessage={emptyMessage} />
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
