import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpensesTable } from '@/components/ExpensesTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
import { useTranslation } from 'react-i18next'

export function ExpensesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const {
    status,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const { data: expenses = [], isLoading: expensesLoading } =
    useExpenses(spreadsheetId)
  const [popupOpen, setPopupOpen] = useState(false)

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', spreadsheetId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', spreadsheetId] })
    navigate('/expenses')
  }

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Expenses</h2>

      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('expenses.addExpense')}
            </button>
          </div>

          {expensesLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : expenses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
              <p className="text-gray-600">{t('expenses.empty')}</p>
            </div>
          ) : (
            <ExpensesTable expenses={expenses} />
          )}
        </>
      )}

      <CreateExpensePopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSuccess={handleSuccess}
        spreadsheetId={spreadsheetId}
      />
    </div>
  )
}
