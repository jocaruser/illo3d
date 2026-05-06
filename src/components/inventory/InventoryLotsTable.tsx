import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/SectionHeading'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import type { Lot, Transaction } from '@/types/money'

interface Props {
  lotsForItem: Lot[]
  txnById: Map<string, Transaction>
  lotQuantityInputs: Record<string, string>
  lotAmountInputs: Record<string, string>
  onQuantityChange: (lotId: string, value: string) => void
  onAmountChange: (lotId: string, value: string) => void
  onSaveLot: (lot: Lot) => void
  lotSaveBusyId: string | null
}

export function InventoryLotsTable({
  lotsForItem,
  txnById,
  lotQuantityInputs,
  lotAmountInputs,
  onQuantityChange,
  onAmountChange,
  onSaveLot,
  lotSaveBusyId,
}: Props) {
  const { t } = useTranslation()

  return (
    <section>
      <SectionHeading title={t('inventoryDetail.lotsTitle')} />
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('jobs.colId')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.lotDate')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.lotQuantity')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.lotAmount')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.transaction')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
                {t('inventoryDetail.lotActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {lotsForItem.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400"
                >
                  {t('inventoryDetail.lotsEmpty')}
                </td>
              </tr>
            ) : null}
            {lotsForItem.map((lot) => {
              const tx = txnById.get(lot.transaction_id)
              return (
                <tr key={lot.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <Link
                      to={`/transactions/${lot.transaction_id}`}
                      data-testid={`inventory-lot-tx-${lot.id}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                    >
                      {lot.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {formatInventoryCreatedDate(lot.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-testid={`inventory-detail-lot-qty-${lot.id}`}
                      className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={lotQuantityInputs[lot.id] ?? ''}
                      onChange={(e) => onQuantityChange(lot.id, e.target.value)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-testid={`inventory-detail-lot-amt-${lot.id}`}
                      className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={lotAmountInputs[lot.id] ?? ''}
                      onChange={(e) => onAmountChange(lot.id, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {tx?.concept.trim() ? tx.concept : lot.transaction_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      data-testid={`inventory-detail-save-lot-${lot.id}`}
                      disabled={lotSaveBusyId !== null}
                      onClick={() => void onSaveLot(lot)}
                      className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      {lotSaveBusyId === lot.id
                        ? t('inventoryDetail.saving')
                        : t('inventoryDetail.saveLot')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
