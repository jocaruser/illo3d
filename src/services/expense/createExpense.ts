import { getSheetsRepository } from '@/services/sheets/repository'
import type { ExpenseCategory } from '@/types/money'

export interface CreateExpensePayload {
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
}

function nextNumericId(prefix: string, existingIds: string[]): string {
  const nums = existingIds
    .filter((id) => id != null && id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}${max + 1}`
}

export async function createExpense(
  spreadsheetId: string,
  payload: CreateExpensePayload
): Promise<void> {
  const repo = getSheetsRepository()
  const expenses = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'expenses'
  )
  const transactions = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'transactions'
  )
  const expenseId = nextNumericId(
    'E',
    expenses.map((e) => e.id).filter((id): id is string => id != null)
  )
  const transactionId = nextNumericId(
    'T',
    transactions.map((t) => t.id).filter((id): id is string => id != null)
  )

  const expenseRow = {
    id: expenseId,
    date: payload.date,
    category: payload.category,
    amount: payload.amount,
    notes: payload.notes ?? '',
  }

  const transactionRow = {
    id: transactionId,
    date: payload.date,
    type: 'expense',
    amount: -payload.amount,
    category: payload.category,
    concept: payload.notes ?? payload.category,
    ref_type: 'expense',
    ref_id: expenseId,
    client_id: '',
    notes: payload.notes ?? '',
  }

  await repo.appendRows(spreadsheetId, 'expenses', [expenseRow])
  await repo.appendRows(spreadsheetId, 'transactions', [transactionRow])
}
