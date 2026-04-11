import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Expense } from '@/types/money'
import { formatCurrency } from '@/utils/money'

interface ExpensesTableProps {
  expenses: Expense[]
  inventoryByExpenseId?: Map<string, string>
}

export function ExpensesTable({
  expenses,
  inventoryByExpenseId,
}: ExpensesTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('expenses.date')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('expenses.category')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('expenses.amount')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('expenses.notes')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('inventory.expenseColumn')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {expenses.map((exp) => (
            <tr
              key={exp.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {exp.date}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {t(`expenses.category.${exp.category}`)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-red-600">
                {formatCurrency(-exp.amount)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                {exp.notes ?? ''}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                {inventoryByExpenseId?.has(exp.id) ? (
                  <Link
                    to="/inventory"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {t('inventory.linkLabel')}
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
