import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { formatCurrency } from '@/utils/money'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import { updateInventoryThresholds } from '@/services/inventory/updateInventoryThresholds'
import { buildInventoryConsumptionRows } from '@/lib/inventoryDetail/consumptionRows'
import type { Inventory, Lot, Transaction } from '@/types/money'

function isActiveInventory(row: Inventory): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

function isActiveLot(l: Lot): boolean {
  return l.archived !== 'true' && l.deleted !== 'true'
}

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const { inventoryId = '' } = useParams<{ inventoryId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
    workbookError,
    onRetry,
  } = useWorkbookConnection()

  const {
    inventory: allInventory,
    lots: allLots,
    pieceItems,
    pieces,
    jobs,
    transactions,
  } = useWorkbookEntities()

  const item = useMemo(() => {
    if (!inventoryId) return undefined
    return allInventory.find((i) => i.id === inventoryId && isActiveInventory(i))
  }, [allInventory, inventoryId])

  const lotsForItem = useMemo(() => {
    if (!inventoryId) return []
    return allLots
      .filter((l) => l.inventory_id === inventoryId && isActiveLot(l))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [allLots, inventoryId])

  const consumptionRows = useMemo(
    () => buildInventoryConsumptionRows(inventoryId, pieceItems, pieces, jobs),
    [inventoryId, pieceItems, pieces, jobs]
  )

  const avgCost = useMemo(() => {
    if (!item) return null
    return computeAvgUnitCost(
      allLots.filter((l) => l.inventory_id === item.id && isActiveLot(l))
    )
  }, [item, allLots])

  const [warnYellow, setWarnYellow] = useState('0')
  const [warnOrange, setWarnOrange] = useState('0')
  const [warnRed, setWarnRed] = useState('0')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)

  useEffect(() => {
    if (!item) return
    setWarnYellow(String(item.warn_yellow))
    setWarnOrange(String(item.warn_orange))
    setWarnRed(String(item.warn_red))
  }, [item])

  const detailFields =
    item != null
      ? [
          { label: t('jobs.colId'), value: item.id },
          {
            label: t('inventory.typeLabel'),
            value: t(`inventory.type.${item.type}`),
          },
          {
            label: t('inventory.qtyCurrent'),
            value: String(item.qty_current),
          },
          {
            label: t('inventory.avgUnitCost'),
            value: avgCost == null ? '—' : formatCurrency(avgCost),
          },
          {
            label: t('inventory.createdAt'),
            value: formatInventoryCreatedDate(item.created_at),
          },
        ]
      : []

  const parseThresholdInput = (raw: string): number => {
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  const onSaveThresholds = async () => {
    if (!spreadsheetId || !item) return
    setSaveError(null)
    setSaveBusy(true)
    try {
      await updateInventoryThresholds(spreadsheetId, item.id, {
        warn_yellow: parseThresholdInput(warnYellow),
        warn_orange: parseThresholdInput(warnOrange),
        warn_red: parseThresholdInput(warnRed),
      })
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : t('inventoryDetail.saveError')
      )
    } finally {
      setSaveBusy(false)
    }
  }

  const thresholdEditor =
    item != null ? (
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">
          {t('inventoryDetail.thresholdsHeading')}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-gray-600">
            <span className="mb-1 block">{t('inventoryDetail.thresholdYellow')}</span>
            <input
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-yellow"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={warnYellow}
              onChange={(e) => setWarnYellow(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-600">
            <span className="mb-1 block">{t('inventoryDetail.thresholdOrange')}</span>
            <input
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-orange"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={warnOrange}
              onChange={(e) => setWarnOrange(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-600">
            <span className="mb-1 block">{t('inventoryDetail.thresholdRed')}</span>
            <input
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-red"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={warnRed}
              onChange={(e) => setWarnRed(e.target.value)}
            />
          </label>
        </div>
        {saveError ? (
          <p className="text-sm text-red-600" role="alert">
            {saveError}
          </p>
        ) : null}
        <button
          type="button"
          data-testid="inventory-detail-save-thresholds"
          disabled={saveBusy}
          onClick={() => void onSaveThresholds()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saveBusy ? t('inventoryDetail.saving') : t('inventoryDetail.saveThresholds')}
        </button>
      </div>
    ) : null

  const txnById = useMemo(() => {
    const m = new Map<string, Transaction>()
    for (const tx of transactions) {
      if (tx.archived !== 'true' && tx.deleted !== 'true') {
        m.set(tx.id, tx)
      }
    }
    return m
  }, [transactions])

  const showCombinedEmpty = lotsForItem.length === 0 && consumptionRows.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={onRetry}
        />
      ) : null}

      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {workbookStatus === 'ready' && inventoryId && !item && (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
          <p className="text-gray-600">{t('inventoryDetail.notFound')}</p>
          <Link
            to="/inventory"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            {t('inventoryDetail.backToList')}
          </Link>
        </div>
      )}

      {workbookStatus === 'ready' && item && (
        <>
          <EntityDetailPage
            backTo="/inventory"
            backLabel={t('inventoryDetail.backToList')}
            title={item.name}
            fields={detailFields}
            editLabel=""
            deleteLabel=""
            onEdit={() => {}}
            onDelete={() => {}}
            hidePrimaryActions
            belowFields={thresholdEditor}
          >
            {showCombinedEmpty ? (
              <EmptyState messageKey="inventoryDetail.sectionsEmpty" />
            ) : (
              <div className="space-y-8">
                {lotsForItem.length > 0 ? (
                  <section>
                    <h3 className="mb-3 text-lg font-semibold text-gray-800">
                      {t('inventoryDetail.lotsTitle')}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.lotDate')}
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.lotQuantity')}
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.lotAmount')}
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.transaction')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {lotsForItem.map((lot) => {
                            const tx = txnById.get(lot.transaction_id)
                            return (
                              <tr key={lot.id}>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                  {formatInventoryCreatedDate(lot.created_at)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                  {lot.quantity}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                  {formatCurrency(lot.amount)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {tx ? (
                                    <Link
                                      to="/transactions"
                                      data-testid={`inventory-lot-tx-${lot.id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {tx.concept.trim() ? tx.concept : lot.transaction_id}
                                    </Link>
                                  ) : (
                                    <Link
                                      to="/transactions"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {lot.transaction_id}
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}

                {consumptionRows.length > 0 ? (
                  <section>
                    <h3 className="mb-3 text-lg font-semibold text-gray-800">
                      {t('inventoryDetail.consumptionTitle')}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.piece')}
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.job')}
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.quantity')}
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                              {t('inventory.createdAt')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {consumptionRows.map((row) => (
                            <tr key={row.pieceItemId}>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                {row.pieceName} ({row.pieceId})
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Link
                                  to={`/jobs/${row.jobId}`}
                                  data-testid={`inventory-consumption-job-${row.pieceItemId}`}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {row.jobDescription}
                                </Link>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                {row.quantity}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                {formatInventoryCreatedDate(row.pieceCreatedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </EntityDetailPage>
        </>
      )}
    </div>
  )
}
