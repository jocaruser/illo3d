import { useTranslation } from 'react-i18next'
import type { MaterialsSummaryRow } from '@/utils/jobMaterialsSummary'
import { formatCurrency } from '@/utils/money'

interface JobMaterialsSummaryProps {
  rows: MaterialsSummaryRow[]
}

export function JobMaterialsSummary({ rows }: JobMaterialsSummaryProps) {
  const { t } = useTranslation()
  const colCount = 6

  return (
    <section className="mb-8">
      <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {t('jobs.materialsSummaryTitle')}
      </h3>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-600 dark:text-gray-400">
              <th className="py-2 pr-4">{t('jobs.materialsColInventory')}</th>
              <th className="py-2 pr-4">{t('jobs.materialsColQty')}</th>
              <th className="py-2 pr-4">{t('jobs.materialsColRemaining')}</th>
              <th className="py-2 pr-4">{t('jobs.materialsColCost')}</th>
              <th className="py-2 pr-4">{t('jobs.materialsColRedos')}</th>
              <th className="py-2">{t('jobs.materialsColUsedIn')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {t('jobs.materialsSummaryEmpty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const qtyDisplay =
                  row.inventoryType === 'filament'
                    ? `${row.totalQuantity}g`
                    : `${row.totalQuantity} ${t('jobs.materialsUnits')}`
                return (
                  <tr key={row.inventoryId}>
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                      {row.inventoryName}
                    </td>
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                      {qtyDisplay}
                    </td>
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                      {row.remainingQty == null
                        ? '—'
                        : row.remainingQty < 0
                          ? '0'
                          : row.remainingQty}
                    </td>
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                      {row.estimatedCost == null
                        ? '—'
                        : formatCurrency(row.estimatedCost)}
                    </td>
                    <td className="py-2 pr-4">
                      {row.redos == null ? (
                        '—'
                      ) : (
                        <span
                          className={
                            row.redos >= 2
                              ? 'text-green-700 dark:text-green-300'
                              : row.redos === 1
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {row.redos}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-800 dark:text-gray-200">
                      {row.usedInPieces.join(', ')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
