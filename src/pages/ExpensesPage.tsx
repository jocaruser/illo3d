import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { useExpenses } from '@/hooks/useExpenses'
import { useInventory } from '@/hooks/useInventory'
import { ExpensesTable } from '@/components/ExpensesTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { QueryError } from '@/components/QueryError'
import { useTranslation } from 'react-i18next'
import { updateExpense } from '@/services/expense/updateExpense'
import { deleteExpense } from '@/services/expense/deleteExpense'
import type { Expense } from '@/types/money'
import type { UpdateExpensePayload } from '@/services/expense/updateExpense'

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

  const {
    data: expenses = [],
    isLoading: expensesLoading,
    isError: expensesError,
    refetch: refetchExpenses,
  } = useExpenses(spreadsheetId)
  const { data: inventory = [] } = useInventory(spreadsheetId)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const expensePopupOpen = createOpen || editingExpense !== null

  const inventoryByExpenseId = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of inventory) {
      map.set(item.expense_id, item.id)
    }
    return map
  }, [inventory])

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', spreadsheetId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', spreadsheetId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', spreadsheetId] })
    navigate('/expenses')
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses', spreadsheetId] })
    queryClient.invalidateQueries({ queryKey: ['transactions', spreadsheetId] })
  }

  const handleUpdateExpense = async (
    expenseId: string,
    payload: UpdateExpensePayload
  ) => {
    if (!spreadsheetId) return
    const key = ['expenses', spreadsheetId] as const
    const previous = queryClient.getQueryData<Expense[]>(key)
    if (previous) {
      queryClient.setQueryData(
        key,
        previous.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                date: payload.date,
                category: payload.category,
                amount: payload.amount,
                notes: payload.notes,
              }
            : e
        )
      )
    }
    try {
      await updateExpense(spreadsheetId, expenseId, payload)
    } catch (e) {
      if (previous) {
        queryClient.setQueryData(key, previous)
      }
      throw e
    }
  }

  const closeExpensePopup = () => {
    setCreateOpen(false)
    setEditingExpense(null)
  }

  const confirmDeleteExpense = async () => {
    if (!spreadsheetId || !deleteTarget) return
    setDeleteError(null)
    try {
      await deleteExpense(spreadsheetId, deleteTarget.id)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['expenses', spreadsheetId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', spreadsheetId] })
      queryClient.invalidateQueries({ queryKey: ['inventory', spreadsheetId] })
    } catch {
      setDeleteError(t('errors.deleteFailed'))
    }
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
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('page.expenses')}</h2>

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
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null)
                setCreateOpen(true)
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('expenses.addExpense')}
            </button>
          </div>

          {expensesError ? (
            <QueryError onRetry={() => void refetchExpenses()} />
          ) : expensesLoading ? (
            <LoadingSpinner />
          ) : expenses.length === 0 ? (
            <EmptyState messageKey="expenses.empty" />
          ) : (
            <ExpensesTable
              expenses={expenses}
              inventoryByExpenseId={inventoryByExpenseId}
              onEdit={(e) => {
                setCreateOpen(false)
                setEditingExpense(e)
              }}
              onDelete={(e) => setDeleteTarget(e)}
            />
          )}
        </>
      )}

      <CreateExpensePopup
        isOpen={expensePopupOpen}
        onClose={closeExpensePopup}
        onSuccess={
          editingExpense ? handleEditSuccess : handleCreateSuccess
        }
        spreadsheetId={spreadsheetId}
        initialExpense={editingExpense}
        onUpdateExpense={handleUpdateExpense}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t('expenses.deleteConfirmTitle')}
        message={t('expenses.deleteConfirmMessage', {
          id: deleteTarget?.id ?? '',
        })}
        confirmLabel={t('expenses.delete')}
        cancelLabel={t('expenses.cancel')}
        onConfirm={confirmDeleteExpense}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError(null)
        }}
      >
        {deleteError ? (
          <p className="text-sm text-red-600">{deleteError}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
