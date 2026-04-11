import { useTranslation } from 'react-i18next'
import type { Client } from '@/types/money'

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('clients.name')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('clients.email')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('clients.phone')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('clients.notes')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('clients.createdAt')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {clients.map((client) => (
            <tr
              key={client.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                {client.name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {client.email ?? ''}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {client.phone ?? ''}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                {client.notes ?? ''}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {client.created_at}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
