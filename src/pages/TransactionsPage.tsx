import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { TransactionsTable } from '@/components/TransactionsTable'
import { BalanceDisplay } from '@/components/BalanceDisplay'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
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
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const { transactions: allTransactions, clients, inventory } =
    useWorkbookEntities()
  const transactions = useMemo(
    () => allTransactions.filter(isActiveTransaction),
    [allTransactions],
  )

  const inventoryByExpenseId = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of inventory) {
      if (row.archived === 'true' || row.deleted === 'true') continue
      if (row.expense_id) map.set(row.expense_id, row.id)
    }
    return map
  }, [inventory])

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  const balance = calculateBalance(transactions.map((tx) => tx.amount))

  const handleExpenseSuccess = () => {
    navigate('/expenses')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('page.transactions')}</h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={handleRetry}
        />
      ) : null}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <BalanceDisplay balance={balance} />
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('expenses.addExpense')}
            </button>
          </div>

          {transactions.length === 0 ? (
            <EmptyState messageKey="transactions.empty" />
          ) : (
            <TransactionsTable
              transactions={transactions}
              clients={clients}
              inventoryByExpenseId={inventoryByExpenseId}
            />
          )}
        </>
      )}

      <CreateExpensePopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSuccess={handleExpenseSuccess}
        spreadsheetId={spreadsheetId}
      />
    </div>
  )
}
