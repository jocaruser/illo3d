import { getSheetsRepository } from '@/services/sheets/repository'
import type { Expense, ExpenseCategory, Transaction } from '@/types/money'
import type { SheetName } from '@/services/sheets/config'

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
  const repo = getSheetsRepository()
  const expenses = await repo.readRows<Expense>(
    spreadsheetId,
    'expenses' as SheetName
  )
  const idx = expenses.findIndex((e) => e.id === expenseId)
  if (idx === -1) {
    throw new Error(`Expense ${expenseId} not found`)
  }

  const notesTrimmed = payload.notes?.trim() ?? ''
  const expenseRow = {
    id: expenseId,
    date: payload.date,
    category: payload.category,
    amount: payload.amount,
    notes: notesTrimmed,
  }
  await repo.updateRow(
    spreadsheetId,
    'expenses' as SheetName,
    idx + 1,
    expenseRow
  )

  const transactions = await repo.readRows<Transaction>(
    spreadsheetId,
    'transactions' as SheetName
  )
  const tIdx = transactions.findIndex(
    (t) => t.ref_type === 'expense' && t.ref_id === expenseId
  )
  if (tIdx === -1) {
    return
  }
  const tx = transactions[tIdx]
  const concept = notesTrimmed !== '' ? notesTrimmed : payload.category
  const txRow = {
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
  }
  await repo.updateRow(
    spreadsheetId,
    'transactions' as SheetName,
    tIdx + 1,
    txRow
  )
}
