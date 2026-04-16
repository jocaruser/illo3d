import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { ExpensesTable } from '@/components/ExpensesTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { CreateExpensePopup } from '@/components/CreateExpensePopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { useTranslation } from 'react-i18next'
import { updateExpense } from '@/services/expense/updateExpense'
import { deleteExpense } from '@/services/expense/deleteExpense'
import type { Expense } from '@/types/money'
import type { UpdateExpensePayload } from '@/services/expense/updateExpense'

function isActiveExpense(e: Expense): boolean {
  return e.archived !== 'true' && e.deleted !== 'true'
}

export function ExpensesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const { expenses: allExpenses, inventory } = useWorkbookEntities()
  const expenses = useMemo(
    () => allExpenses.filter(isActiveExpense),
    [allExpenses],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const expensePopupOpen = createOpen || editingExpense !== null

  const inventoryByExpenseId = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of inventory) {
      if (item.archived === 'true' || item.deleted === 'true') continue
      map.set(item.expense_id, item.id)
    }
    return map
  }, [inventory])

  const handleCreateSuccess = () => {
    navigate('/expenses')
  }

  const handleEditSuccess = () => {}

  const handleUpdateExpense = async (
    expenseId: string,
    payload: UpdateExpensePayload
  ) => {
    if (!spreadsheetId) return
    await updateExpense(spreadsheetId, expenseId, payload)
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
    } catch {
      setDeleteError(t('errors.deleteFailed'))
    }
  }

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('page.expenses')}</h2>

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

          {expenses.length === 0 ? (
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
