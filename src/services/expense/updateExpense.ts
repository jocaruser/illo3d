import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToExpenses,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { ExpenseCategory } from '@/types/money'

export interface UpdateExpensePayload {
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
}

export async function updateExpense(
  spreadsheetId: string,
  expenseId: string,
  payload: UpdateExpensePayload
): Promise<void> {
  void spreadsheetId
  const expenses = matrixToExpenses(useWorkbookStore.getState().tabs.expenses)
  const existing = expenses.find((e) => e.id === expenseId)
  if (!existing) {
    throw new Error(`Expense ${expenseId} not found`)
  }

  const notesTrimmed = payload.notes?.trim() ?? ''
  const expenseRow: Record<string, unknown> = {
    id: expenseId,
    date: payload.date,
    category: payload.category,
    amount: payload.amount,
    notes: notesTrimmed,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }
  patchWorkbookTab('expenses', (m) =>
    updateDataRowById('expenses', m, expenseId, expenseRow),
  )

  const transactions = matrixToTransactions(
    useWorkbookStore.getState().tabs.transactions,
  )
  const tx = transactions.find(
    (t) => t.ref_type === 'expense' && t.ref_id === expenseId,
  )
  if (!tx) return

  const concept = notesTrimmed !== '' ? notesTrimmed : payload.category
  const txRow: Record<string, unknown> = {
    id: tx.id,
    date: payload.date,
    type: 'expense',
    amount: -payload.amount,
    category: payload.category,
    concept,
    ref_type: 'expense',
    ref_id: expenseId,
    client_id: tx.client_id ?? '',
    notes: notesTrimmed,
    archived: tx.archived ?? '',
    deleted: tx.deleted ?? '',
  }
  patchWorkbookTab('transactions', (m) =>
    updateDataRowById('transactions', m, tx.id, txRow),
  )
}
