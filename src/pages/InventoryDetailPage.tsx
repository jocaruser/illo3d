import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { deleteInventory } from '@/services/inventory/deleteInventory'
import { updateInventoryQtyCurrent } from '@/services/inventory/updateInventoryQtyCurrent'
import { updateInventoryThresholds } from '@/services/inventory/updateInventoryThresholds'
import {
  parseLotPurchaseAmountInput,
  parseLotQuantityInput,
  updateLotFields,
} from '@/services/lots/updateLotAmount'
import { computeAvgUnitCost } from '@/utils/avgUnitCost'
import { formatCurrency } from '@/utils/money'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'
import { buildInventoryConsumptionRows } from '@/lib/inventoryDetail/consumptionRows'
import type { Inventory, Lot, Transaction } from '@/types/money'

function isActiveInventory(row: Inventory): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

function isActiveLot(l: Lot): boolean {
  return l.archived !== 'true' && l.deleted !== 'true'
}

function parseQtyCurrentInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = parseInt(trimmed, 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
    [inventoryId, pieceItems, pieces, jobs],
  )

  const avgCost = useMemo(() => {
    if (!item) return null
    return computeAvgUnitCost(
      allLots.filter((l) => l.inventory_id === item.id && isActiveLot(l)),
    )
  }, [item, allLots])

  const [qtyInput, setQtyInput] = useState('')
  const [qtySaveError, setQtySaveError] = useState<string | null>(null)
  const [qtySaveBusy, setQtySaveBusy] = useState(false)

  const [warnYellow, setWarnYellow] = useState('0')
  const [warnOrange, setWarnOrange] = useState('0')
  const [warnRed, setWarnRed] = useState('0')
  const [thresholdSaveError, setThresholdSaveError] = useState<string | null>(null)
  const [thresholdSaveBusy, setThresholdSaveBusy] = useState(false)

  const [lotQuantityInputs, setLotQuantityInputs] = useState<Record<string, string>>({})
  const [lotAmountInputs, setLotAmountInputs] = useState<Record<string, string>>({})
  const [lotSaveBusyId, setLotSaveBusyId] = useState<string | null>(null)
  const [lotSaveError, setLotSaveError] = useState<string | null>(null)

  const [archiveTarget, setArchiveTarget] = useState<Inventory | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setWarnYellow(String(item.warn_yellow))
    setWarnOrange(String(item.warn_orange))
    setWarnRed(String(item.warn_red))
    setQtyInput(String(Math.floor(item.qty_current)))
  }, [item])

  const lotsSignature = useMemo(
    () => lotsForItem.map((l) => `${l.id}\0${l.amount}\0${l.quantity}`).join('\n'),
    [lotsForItem],
  )

  useEffect(() => {
    setLotQuantityInputs(
      Object.fromEntries(lotsForItem.map((l) => [l.id, String(l.quantity)])),
    )
    setLotAmountInputs(Object.fromEntries(lotsForItem.map((l) => [l.id, String(l.amount)])))
    setLotSaveError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when server-backed lot data changes
  }, [lotsSignature])

  const detailFields =
    item != null
      ? [
          { label: t('jobs.colId'), value: item.id },
          {
            label: t('inventory.typeLabel'),
            value: t(`inventory.type.${item.type}`),
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
    setThresholdSaveError(null)
    setThresholdSaveBusy(true)
    try {
      await updateInventoryThresholds(spreadsheetId, item.id, {
        warn_yellow: parseThresholdInput(warnYellow),
        warn_orange: parseThresholdInput(warnOrange),
        warn_red: parseThresholdInput(warnRed),
      })
    } catch (e) {
      setThresholdSaveError(
        e instanceof Error ? e.message : t('inventoryDetail.saveError'),
      )
    } finally {
      setThresholdSaveBusy(false)
    }
  }

  const onSaveQtyCurrent = async () => {
    if (!spreadsheetId || !item) return
    setQtySaveError(null)
    const parsed = parseQtyCurrentInput(qtyInput)
    if (parsed == null) {
      setQtySaveError(t('inventoryDetail.qtyInvalid'))
      return
    }
    setQtySaveBusy(true)
    try {
      await updateInventoryQtyCurrent(spreadsheetId, item.id, parsed)
    } catch (e) {
      setQtySaveError(
        e instanceof Error ? e.message : t('inventoryDetail.qtySaveError'),
      )
    } finally {
      setQtySaveBusy(false)
    }
  }

  const onSaveLot = async (lot: Lot) => {
    if (!spreadsheetId) return
    setLotSaveError(null)
    const qty = parseLotQuantityInput(lotQuantityInputs[lot.id] ?? '')
    const amt = parseLotPurchaseAmountInput(lotAmountInputs[lot.id] ?? '')
    if (qty == null) {
      setLotSaveError(t('inventoryDetail.lotQuantityInvalid'))
      return
    }
    if (amt == null) {
      setLotSaveError(t('inventoryDetail.lotAmountInvalid'))
      return
    }
    setLotSaveBusyId(lot.id)
    try {
      await updateLotFields(spreadsheetId, lot.id, { quantity: qty, amount: amt })
    } catch (e) {
      setLotSaveError(
        e instanceof Error ? e.message : t('inventoryDetail.lotSaveError'),
      )
    } finally {
      setLotSaveBusyId(null)
    }
  }

  const confirmArchiveInventory = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteInventory(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
      navigate('/inventory')
    } catch (e) {
      setArchiveError(
        e instanceof Error ? e.message : t('inventoryDetail.archiveError'),
      )
    }
  }

  const thresholdEditor =
    item != null ? (
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">
          {t('inventoryDetail.qtyHeading')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm text-gray-600">
            <span className="mb-1 block">{t('inventory.qtyCurrent')}</span>
            <input
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-qty-current"
              className="w-40 rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="inventory-detail-save-qty"
            disabled={qtySaveBusy}
            onClick={() => void onSaveQtyCurrent()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {qtySaveBusy ? t('inventoryDetail.saving') : t('inventoryDetail.saveQty')}
          </button>
        </div>
        {qtySaveError ? (
          <p className="text-sm text-red-600" role="alert">
            {qtySaveError}
          </p>
        ) : null}

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
        {thresholdSaveError ? (
          <p className="text-sm text-red-600" role="alert">
            {thresholdSaveError}
          </p>
        ) : null}
        <button
          type="button"
          data-testid="inventory-detail-save-thresholds"
          disabled={thresholdSaveBusy}
          onClick={() => void onSaveThresholds()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {thresholdSaveBusy
            ? t('inventoryDetail.saving')
            : t('inventoryDetail.saveThresholds')}
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
            deleteLabel={t('lifecycle.archive')}
            onEdit={() => {}}
            onDelete={() => {
              setArchiveError(null)
              setArchiveTarget(item)
            }}
            hideEditButton
            belowFields={thresholdEditor}
          >
            {lotSaveError ? (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {lotSaveError}
              </p>
            ) : null}
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
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                              {t('inventoryDetail.lotActions')}
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
                                <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    data-testid={`inventory-detail-lot-qty-${lot.id}`}
                                    className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                    value={lotQuantityInputs[lot.id] ?? ''}
                                    onChange={(e) =>
                                      setLotQuantityInputs((prev) => ({
                                        ...prev,
                                        [lot.id]: e.target.value,
                                      }))
                                    }
                                  />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    data-testid={`inventory-detail-lot-amt-${lot.id}`}
                                    className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                    value={lotAmountInputs[lot.id] ?? ''}
                                    onChange={(e) =>
                                      setLotAmountInputs((prev) => ({
                                        ...prev,
                                        [lot.id]: e.target.value,
                                      }))
                                    }
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {tx ? (
                                    <Link
                                      to={`/transactions/${lot.transaction_id}`}
                                      data-testid={`inventory-lot-tx-${lot.id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {tx.concept.trim() ? tx.concept : lot.transaction_id}
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/transactions/${lot.transaction_id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {lot.transaction_id}
                                    </Link>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    data-testid={`inventory-detail-save-lot-${lot.id}`}
                                    disabled={lotSaveBusyId !== null}
                                    onClick={() => void onSaveLot(lot)}
                                    className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

          <ConfirmDialog
            isOpen={archiveTarget !== null}
            title={t('inventoryDetail.archiveConfirmTitle')}
            message={t('inventoryDetail.archiveConfirmMessage', {
              name: archiveTarget?.name ?? '',
            })}
            confirmLabel={t('lifecycle.archive')}
            cancelLabel={t('clients.cancel')}
            onConfirm={() => void confirmArchiveInventory()}
            onCancel={() => {
              setArchiveTarget(null)
              setArchiveError(null)
            }}
          >
            {archiveError ? (
              <p className="text-sm text-red-600">{archiveError}</p>
            ) : null}
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
