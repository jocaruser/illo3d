import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { TransactionsTable } from '@/components/TransactionsTable'
import { BalanceDisplay } from '@/components/BalanceDisplay'
import { EmptyState } from '@/components/EmptyState'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { CreatePurchasePopup } from '@/components/CreatePurchasePopup'
import { calculateBalance } from '@/utils/money'
import { useTranslation } from 'react-i18next'
import type { Transaction } from '@/types/money'
import { buildExpenseLotLinkMaps } from '@/lib/money/transactionConceptLink'

function isActiveTransaction(txn: Transaction): boolean {
  return txn.archived !== 'true' && txn.deleted !== 'true'
}

export function TransactionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [popupOpen, setPopupOpen] = useState(false)
  const [query, setQuery] = useState('')
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

  const { transactions: allTransactions, clients, lots } = useWorkbookEntities()
  const transactions = useMemo(
    () => allTransactions.filter(isActiveTransaction),
    [allTransactions],
  )

  const { expenseTxnIdsWithLots } = useMemo(
    () => buildExpenseLotLinkMaps(lots),
    [lots],
  )

  const balance = calculateBalance(transactions.map((tx) => tx.amount))

  const handlePurchaseSuccess = (newTransactionId?: string) => {
    if (newTransactionId) {
      navigate(`/transactions/${newTransactionId}`)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {workbookStatus === 'ready' && (
        <>
          <ListTablePageHeader
            title={t('page.transactions')}
            search={
              <ListTableSearchField
                value={query}
                onChange={setQuery}
                placeholder={t('listTable.searchPlaceholder')}
                ariaLabel={t('listTable.searchAria')}
              />
            }
            actions={
              <div className="flex items-center gap-4">
                <BalanceDisplay balance={balance} />
                <button
                  type="button"
                  data-testid="transactions-record-purchase"
                  onClick={() => {
                    setQuery('')
                    setPopupOpen(true)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('purchase.recordButton')}
                </button>
              </div>
            }
          />

          {transactions.length === 0 ? (
            <EmptyState messageKey="transactions.empty" />
          ) : (
            <TransactionsTable
              transactions={transactions}
              query={query}
              clients={clients}
              expenseTxnIdsWithLots={expenseTxnIdsWithLots}
            />
          )}
        </>
      )}

      <CreatePurchasePopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSuccess={handlePurchaseSuccess}
        spreadsheetId={spreadsheetId}
      />
    </div>
  )
}
