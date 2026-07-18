import { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { RelativeTime } from '@/Component/RelativeTime'
import { ColourEditor } from '@/Component/detail/ColourEditor'
import {
  ArchivedEntityNotice,
  EntityDetailPage,
} from '@/Component/detail/EntityDetailPage'
import {
  InventoryConsumptionTable,
  type InventoryConsumptionRow,
} from '@/Component/detail/InventoryConsumptionTable'
import {
  InventoryLotsTable,
  type InventoryLotRow,
} from '@/Component/detail/InventoryLotsTable'
import { QtyEditor } from '@/Component/detail/QtyEditor'
import { ThresholdEditor } from '@/Component/detail/ThresholdEditor'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import type { InventoryItem } from '@/Entity/InventoryItem'
import { useEntityManager } from '@/Hook/useEntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { formatCurrency } from '@/Service/Pricing/money'

const BACK_TO = '/inventory'

type LifecycleAction = 'archive' | 'delete'

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const { inventoryId = '' } = useParams<{ inventoryId: string }>()
  const em = useEntityManager()
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const item = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.inventory.find(inventoryId)
  }, [em, inventoryId, revision])

  // Only a soft-deleted material loses its address; an archived one keeps
  // rendering read-only (ADR-0014's "reachable at its own address").
  if (item === null || item.isDeleted()) {
    return (
      <NotFoundCard
        message={t('inventoryDetail.notFound')}
        backTo={BACK_TO}
        backLabel={t('inventoryDetail.backToList')}
      />
    )
  }
  return <InventoryDetail item={item} onLifecycleChanged={bump} />
}

interface InventoryDetailProps {
  item: InventoryItem
  /** Re-reads the item after Un-archive flips its lifecycle flags. */
  onLifecycleChanged: () => void
}

function InventoryDetail({ item, onLifecycleChanged }: InventoryDetailProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const [lifecycle, setLifecycle] = useState<LifecycleAction | null>(null)

  // Active → editors + Archive; archived → read-only with Un-archive + Soft
  // delete; soft-deleted → not found above.
  const archived = item.isArchived()

  const lots = useMemo(
    () => em.lots.findActiveByInventory(item.id),
    [em, item.id]
  )

  const lotRows = useMemo<InventoryLotRow[]>(
    () =>
      lots.map((lot) => ({
        lot,
        transactionLabel:
          em.transactions.find(lot.transactionId)?.concept ?? '',
      })),
    [em, lots]
  )

  const consumptionRows = useMemo<InventoryConsumptionRow[]>(
    () =>
      em.pieceItems.findActiveByInventory(item.id).map((line) => {
        const piece = em.pieces.find(line.pieceId)
        const job = piece === null ? null : em.jobs.find(piece.jobId)
        return {
          id: line.id,
          quantity: line.quantity,
          pieceName: piece?.name ?? line.pieceId,
          jobId: job?.id ?? '',
          jobLabel: job?.description ?? '',
        }
      }),
    [em, item.id]
  )

  const avgUnitCost = computeAvgUnitCost(lots)

  const confirmLifecycle = () => {
    const service = new LifecycleService(em)
    // Archiving cascades to the item's active lots.
    if (lifecycle === 'delete') service.softDeleteInventory(item.id)
    else service.archiveInventory(item.id)
    setLifecycle(null)
    void navigate(BACK_TO)
  }

  const unarchive = () => {
    new LifecycleService(em).restoreInventory(item.id)
    onLifecycleChanged()
  }

  return (
    <EntityDetailPage
      backTo={BACK_TO}
      backLabel={t('inventoryDetail.backToList')}
      title={item.name}
      fields={[
        { label: t('inventory.colId'), value: item.id },
        {
          label: t('inventory.typeLabel'),
          value: t(`inventory.type.${item.type}`),
        },
        {
          label: t('inventory.avgUnitCost'),
          value: avgUnitCost === null ? '—' : formatCurrency(avgUnitCost),
        },
        {
          label: t('inventory.createdAt'),
          value: <RelativeTime value={item.createdAt} />,
        },
      ]}
      banner={archived ? <ArchivedEntityNotice /> : undefined}
      actions={
        archived ? (
          <>
            <button
              type="button"
              data-testid="entity-detail-unarchive"
              className="btn-secondary"
              onClick={unarchive}
            >
              {t('lifecycle.unarchive')}
            </button>
            <button
              type="button"
              data-testid="entity-detail-delete"
              className="btn-secondary"
              onClick={() => setLifecycle('delete')}
            >
              {t('lifecycle.softDelete')}
            </button>
          </>
        ) : (
          <button
            type="button"
            data-testid="entity-detail-archive"
            className="btn-secondary"
            onClick={() => setLifecycle('archive')}
          >
            {t('lifecycle.archive')}
          </button>
        )
      }
    >
      <div className="space-y-8">
        <QtyEditor
          itemId={item.id}
          qtyCurrent={item.qtyCurrent}
          readOnly={archived}
        />
        <ThresholdEditor item={item} readOnly={archived} />
        <ColourEditor
          itemId={item.id}
          colour={item.colour}
          readOnly={archived}
        />
        <InventoryLotsTable rows={lotRows} readOnly={archived} />
        <InventoryConsumptionTable rows={consumptionRows} />
      </div>
      <ConfirmDialog
        open={lifecycle !== null}
        title={
          lifecycle === 'delete'
            ? t('inventoryDetail.deleteConfirmTitle')
            : t('inventoryDetail.archiveConfirmTitle')
        }
        message={
          lifecycle === 'delete'
            ? t('inventoryDetail.deleteConfirmMessage', { name: item.name })
            : t('inventoryDetail.archiveConfirmMessage', { name: item.name })
        }
        confirmLabel={
          lifecycle === 'delete'
            ? t('lifecycle.softDelete')
            : t('lifecycle.archive')
        }
        onConfirm={confirmLifecycle}
        onCancel={() => setLifecycle(null)}
      />
    </EntityDetailPage>
  )
}
