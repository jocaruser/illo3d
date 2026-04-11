import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useTransactions } from '@/hooks/useTransactions'
import { useClients } from '@/hooks/useClients'
import { TransactionsTable } from '@/components/TransactionsTable'
import { BalanceDisplay } from '@/components/BalanceDisplay'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
import { calculateBalance } from '@/utils/money'
import { useTranslation } from 'react-i18next'

export function TransactionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [popupOpen, setPopupOpen] = useState(false)
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const {
    status,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions(spreadsheetId)
  const { data: clients = [] } = useClients(spreadsheetId)

  useEffect(() => {
    if (!spreadsheetId) return
    setConnecting()
    connect(spreadsheetId).then((result) => {
      if (result.ok) {
        setConnected(result.spreadsheetId)
      } else {
        setError(result.error)
      }
    })
  }, [spreadsheetId, setConnecting, setConnected, setError])

  const handleRetry = async () => {
    if (!spreadsheetId) return
    setConnecting()
    const result = await connect(spreadsheetId)
    if (result.ok) {
      setConnected(result.spreadsheetId)
    } else {
      setError(result.error)
    }
  }

  const balance = calculateBalance(transactions.map((t) => t.amount))

  const handleExpenseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', spreadsheetId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', spreadsheetId] })
    navigate('/expenses')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Transactions</h2>

      {spreadsheetId ? (
        <ConnectionStatus
          status={status}
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      ) : null}

      {status === 'connected' && (
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

          {transactionsLoading ? (
            <LoadingSpinner />
          ) : transactions.length === 0 ? (
            <EmptyState messageKey="transactions.empty" />
          ) : (
            <TransactionsTable transactions={transactions} clients={clients} />
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
