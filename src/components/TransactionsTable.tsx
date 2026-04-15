import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Transaction } from '@/types/money'
import type { Client } from '@/types/money'
import { formatCurrency } from '@/utils/money'

interface TransactionsTableProps {
  transactions: Transaction[]
  clients: Client[]
}

function getClientName(clients: Client[], clientId?: string): string {
  if (!clientId) return ''
  const client = clients.find((c) => c.id === clientId)
  return client?.name ?? ''
}

export function TransactionsTable({
  transactions,
  clients,
}: TransactionsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.date')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.type')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.amount')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.category')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.concept')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('transactions.client')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {tx.date}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {t(`transactions.type.${tx.type}`)}
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(tx.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {tx.category}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                {tx.concept}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {tx.client_id ? (
                  <Link
                    to={`/clients/${tx.client_id}`}
                    data-testid={`transaction-client-link-${tx.client_id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {getClientName(clients, tx.client_id) || tx.client_id}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
