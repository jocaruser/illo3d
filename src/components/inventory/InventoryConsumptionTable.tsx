import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/SectionHeading'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import type { InventoryConsumptionRow } from '@/lib/inventoryDetail/consumptionRows'

interface Props {
  consumptionRows: InventoryConsumptionRow[]
}

export function InventoryConsumptionTable({ consumptionRows }: Props) {
  const { t } = useTranslation()

  return (
    <section>
      <SectionHeading title={t('inventoryDetail.consumptionTitle')} />
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('jobs.colId')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.piece')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.job')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.quantity')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventory.createdAt')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {consumptionRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {t('inventoryDetail.consumptionEmpty')}
                </td>
              </tr>
            ) : null}
            {consumptionRows.map((row) => (
              <tr key={row.pieceItemId}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <Link
                    to={`/jobs/${row.jobId}`}
                    data-testid={`inventory-consumption-job-${row.pieceItemId}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                  >
                    {row.jobId}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {row.pieceName} ({row.pieceId})
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {row.jobDescription}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                  {row.quantity}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {formatInventoryCreatedDate(row.pieceCreatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
