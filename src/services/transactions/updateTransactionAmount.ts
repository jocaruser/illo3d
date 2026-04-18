import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToTransactions } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export function parseExpenseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return null
  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n === 0) return null
  if (n > 0) return -Math.abs(n)
  return n
}

export async function updateTransactionAmount(
  spreadsheetId: string,
  transactionId: string,
  amount: number,
): Promise<void> {
  void spreadsheetId
  const transactions = matrixToTransactions(useWorkbookStore.getState().tabs.transactions)
  const existing = transactions.find((t) => t.id === transactionId)
  if (!existing) {
    throw new Error(`Transaction ${transactionId} not found`)
  }
  if (existing.type !== 'expense') {
    throw new Error('Only expense transaction amounts can be updated from this view')
  }
  if (!Number.isFinite(amount) || amount >= 0) {
    throw new Error('Expense amount must be a negative number')
  }

  const row: Record<string, unknown> = {
    id: existing.id,
    date: existing.date,
    type: existing.type,
    amount,
    category: existing.category,
    concept: existing.concept,
    ref_type: existing.ref_type === 'job' ? 'job' : '',
    ref_id: existing.ref_type === 'job' ? existing.ref_id : '',
    client_id: existing.client_id ?? '',
    notes: existing.notes ?? '',
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('transactions', (m) =>
    updateDataRowById('transactions', m, transactionId, row),
  )
}
