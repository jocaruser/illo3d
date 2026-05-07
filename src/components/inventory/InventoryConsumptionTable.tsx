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
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('jobs.colId')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.piece')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.job')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.quantity')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('inventory.createdAt')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {consumptionRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-text-muted"
                >
                  {t('inventoryDetail.consumptionEmpty')}
                </td>
              </tr>
            ) : null}
            {consumptionRows.map((row, index) => (
              <tr key={row.pieceItemId} className={index % 2 === 0 ? 'bg-surface-elevated' : 'bg-surface-alt'}>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                  <Link
                    to={`/jobs/${row.jobId}`}
                    data-testid={`inventory-consumption-job-${row.pieceItemId}`}
                    className="font-medium text-primary hover:text-blue-800 dark:text-blue-200"
                  >
                    {row.jobId}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                  {row.pieceName} ({row.pieceId})
                </td>
                <td className="px-4 py-3 text-sm text-text">
                  {row.jobDescription}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-text">
                  {row.quantity}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
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
