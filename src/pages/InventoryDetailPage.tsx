import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { NotFoundCard } from '@/components/NotFoundCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { InventoryLotsTable } from '@/components/inventory/InventoryLotsTable'
import { InventoryConsumptionTable } from '@/components/inventory/InventoryConsumptionTable'
import { FormGroup, FormLabel, FormInput } from '@/components/Form'
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
import { toast } from '@/lib/toast'
import { isActiveRow, isActiveLot } from '@/lib/entityFilters'
import type { Inventory, Lot, Transaction } from '@/types/money'

function parseQtyCurrentInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return null
  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { inventoryId = '' } = useParams<{ inventoryId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
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
    return allInventory.find((i) => i.id === inventoryId && isActiveRow(i))
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
  const [qtySaveBusy, setQtySaveBusy] = useState(false)

  const [warnYellow, setWarnYellow] = useState('0')
  const [warnOrange, setWarnOrange] = useState('0')
  const [warnRed, setWarnRed] = useState('0')
  const [thresholdSaveBusy, setThresholdSaveBusy] = useState(false)

  const [lotQuantityInputs, setLotQuantityInputs] = useState<Record<string, string>>({})
  const [lotAmountInputs, setLotAmountInputs] = useState<Record<string, string>>({})
  const [lotSaveBusyId, setLotSaveBusyId] = useState<string | null>(null)

  const [archiveTarget, setArchiveTarget] = useState<Inventory | null>(null)

  useEffect(() => {
    if (!item) return
    setWarnYellow(String(item.warn_yellow))
    setWarnOrange(String(item.warn_orange))
    setWarnRed(String(item.warn_red))
    setQtyInput(
      Number.isInteger(item.qty_current)
        ? String(item.qty_current)
        : String(Math.round(item.qty_current * 100) / 100),
    )
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
    setThresholdSaveBusy(true)
    try {
      await updateInventoryThresholds(spreadsheetId, item.id, {
        warn_yellow: parseThresholdInput(warnYellow),
        warn_orange: parseThresholdInput(warnOrange),
        warn_red: parseThresholdInput(warnRed),
      })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('inventoryDetail.saveError'),
      )
    } finally {
      setThresholdSaveBusy(false)
    }
  }

  const onSaveQtyCurrent = async () => {
    if (!spreadsheetId || !item) return
    const parsed = parseQtyCurrentInput(qtyInput)
    if (parsed == null) {
      toast.error(t('inventoryDetail.qtyInvalid'))
      return
    }
    setQtySaveBusy(true)
    try {
      await updateInventoryQtyCurrent(spreadsheetId, item.id, parsed)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('inventoryDetail.qtySaveError'),
      )
    } finally {
      setQtySaveBusy(false)
    }
  }

  const onSaveLot = async (lot: Lot) => {
    if (!spreadsheetId) return
    const qty = parseLotQuantityInput(lotQuantityInputs[lot.id] ?? '')
    const amt = parseLotPurchaseAmountInput(lotAmountInputs[lot.id] ?? '')
    if (qty == null) {
      toast.error(t('inventoryDetail.lotQuantityInvalid'))
      return
    }
    if (amt == null) {
      toast.error(t('inventoryDetail.lotAmountInvalid'))
      return
    }
    setLotSaveBusyId(lot.id)
    try {
      await updateLotFields(spreadsheetId, lot.id, { quantity: qty, amount: amt })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('inventoryDetail.lotSaveError'),
      )
    } finally {
      setLotSaveBusyId(null)
    }
  }

  const confirmArchiveInventory = async () => {
    if (!spreadsheetId || !archiveTarget) return
    try {
      await deleteInventory(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
      navigate('/inventory')
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('inventoryDetail.archiveError'),
      )
    }
  }

  const thresholdEditor =
    item != null ? (
      <div className="space-y-4 border-t border-border pt-4">
        <p className="text-sm font-semibold text-text">
          {t('inventoryDetail.qtyHeading')}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <FormGroup className="w-40">
            <FormLabel>{t('inventory.qtyCurrent')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              step="0.01"
              data-testid="inventory-detail-qty-current"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
            />
          </FormGroup>
          <button
            type="button"
            data-testid="inventory-detail-save-qty"
            disabled={qtySaveBusy}
            onClick={() => void onSaveQtyCurrent()}
            className="btn-primary disabled:opacity-50"
          >
            {qtySaveBusy ? t('inventoryDetail.saving') : t('inventoryDetail.saveQty')}
          </button>
        </div>
        <p className="text-sm font-semibold text-text">
          {t('inventoryDetail.thresholdsHeading')}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormGroup>
            <FormLabel>{t('inventoryDetail.thresholdYellow')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-yellow"
              value={warnYellow}
              onChange={(e) => setWarnYellow(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>{t('inventoryDetail.thresholdOrange')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-orange"
              value={warnOrange}
              onChange={(e) => setWarnOrange(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>{t('inventoryDetail.thresholdRed')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              step={1}
              data-testid="inventory-detail-warn-red"
              value={warnRed}
              onChange={(e) => setWarnRed(e.target.value)}
            />
          </FormGroup>
        </div>
        <button
          type="button"
          data-testid="inventory-detail-save-thresholds"
          disabled={thresholdSaveBusy}
          onClick={() => void onSaveThresholds()}
          className="btn-primary disabled:opacity-50"
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {workbookStatus === 'ready' && inventoryId && !item && (
        <NotFoundCard
          message={t('inventoryDetail.notFound')}
          backTo="/inventory"
          backLabel={t('inventoryDetail.backToList')}
        />
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
              setArchiveTarget(item)
            }}
            hideEditButton
            belowFields={thresholdEditor}
          >
            <div className="space-y-8">
              <InventoryLotsTable
                lotsForItem={lotsForItem}
                txnById={txnById}
                lotQuantityInputs={lotQuantityInputs}
                lotAmountInputs={lotAmountInputs}
                onQuantityChange={(lotId, value) =>
                  setLotQuantityInputs((prev) => ({ ...prev, [lotId]: value }))
                }
                onAmountChange={(lotId, value) =>
                  setLotAmountInputs((prev) => ({ ...prev, [lotId]: value }))
                }
                onSaveLot={onSaveLot}
                lotSaveBusyId={lotSaveBusyId}
              />

              <InventoryConsumptionTable consumptionRows={consumptionRows} />
            </div>
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
            }}
          >
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
