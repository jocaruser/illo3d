import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createExpense } from '@/services/expense/createExpense'
import type { ExpenseCategory } from '@/types/money'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'filament',
  'consumable',
  'electric',
  'investment',
  'maintenance',
  'other',
]

interface CreateExpensePopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
}

export function CreateExpensePopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
}: CreateExpensePopupProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!date.trim()) errs.date = t('expenses.validation.required')
    if (!category) errs.category = t('expenses.validation.required')
    const amountNum = parseFloat(amount)
    if (!amount.trim()) errs.amount = t('expenses.validation.required')
    else if (Number.isNaN(amountNum) || amountNum <= 0)
      errs.amount = t('expenses.validation.amountPositive')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      await createExpense(spreadsheetId, {
        date,
        category,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t('expenses.title')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="expense-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('expenses.date')}
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.date && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="expense-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('expenses.category')}
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`expenses.category.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="expense-amount"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('expenses.amount')}
            </label>
            <input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="expense-notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('expenses.notes')}
            </label>
            <input
              id="expense-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('expenses.notesPlaceholder')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('expenses.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : t('expenses.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
