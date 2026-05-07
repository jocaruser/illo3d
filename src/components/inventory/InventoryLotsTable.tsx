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
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('jobs.colId')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.lotDate')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.lotQuantity')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.lotAmount')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.transaction')}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                {t('inventoryDetail.lotActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {lotsForItem.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text-muted"
                >
                  {t('inventoryDetail.lotsEmpty')}
                </td>
              </tr>
            ) : null}
            {lotsForItem.map((lot, index) => {
              const tx = txnById.get(lot.transaction_id)
              return (
                <tr key={lot.id} className={index % 2 === 0 ? 'bg-surface-elevated' : 'bg-surface-alt'}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                    <Link
                      to={`/transactions/${lot.transaction_id}`}
                      data-testid={`inventory-lot-tx-${lot.id}`}
                      className="font-medium text-primary hover:text-blue-800 dark:text-blue-200"
                    >
                      {lot.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
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
                  <td className="px-4 py-3 text-sm text-text">
                    {tx?.concept.trim() ? tx.concept : lot.transaction_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      data-testid={`inventory-detail-save-lot-${lot.id}`}
                      disabled={lotSaveBusyId !== null}
                      onClick={() => void onSaveLot(lot)}
                      className="rounded border border-border px-2 py-1 text-xs font-medium text-text hover:bg-surface disabled:opacity-50"
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
