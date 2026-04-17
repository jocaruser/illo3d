import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { TransactionsTable } from '@/components/TransactionsTable'
import { BalanceDisplay } from '@/components/BalanceDisplay'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { CreatePurchasePopup } from '@/components/CreatePurchasePopup'
import { calculateBalance } from '@/utils/money'
import { useTranslation } from 'react-i18next'
import type { Transaction } from '@/types/money'

function isActiveTransaction(txn: Transaction): boolean {
  return txn.archived !== 'true' && txn.deleted !== 'true'
}

export function TransactionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [popupOpen, setPopupOpen] = useState(false)
  const {
    spreadsheetId,
    workbookStatus,
    workbookError,
    onRetry,
  } = useWorkbookConnection()

  const { transactions: allTransactions, clients, lots } = useWorkbookEntities()
  const transactions = useMemo(
    () => allTransactions.filter(isActiveTransaction),
    [allTransactions],
  )

  const expenseTxnIdsWithLots = useMemo(() => {
    const s = new Set<string>()
    for (const l of lots) {
      if (l.archived === 'true' || l.deleted === 'true') continue
      s.add(l.transaction_id)
    }
    return s
  }, [lots])

  const inventoryIdByExpenseTxnId = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of lots) {
      if (l.archived === 'true' || l.deleted === 'true') continue
      if (!m.has(l.transaction_id)) {
        m.set(l.transaction_id, l.inventory_id)
      }
    }
    return m
  }, [lots])

  const balance = calculateBalance(transactions.map((tx) => tx.amount))

  const handlePurchaseSuccess = () => {
    navigate('/transactions')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('page.transactions')}</h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={onRetry}
        />
      ) : null}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <BalanceDisplay balance={balance} />
            <button
              type="button"
              data-testid="transactions-record-purchase"
              onClick={() => setPopupOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('purchase.recordButton')}
            </button>
          </div>

          {transactions.length === 0 ? (
            <EmptyState messageKey="transactions.empty" />
          ) : (
            <TransactionsTable
              transactions={transactions}
              clients={clients}
              expenseTxnIdsWithLots={expenseTxnIdsWithLots}
              inventoryIdByExpenseTxnId={inventoryIdByExpenseTxnId}
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
