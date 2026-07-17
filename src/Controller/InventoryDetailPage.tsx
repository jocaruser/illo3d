import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { RelativeTime } from '@/Component/RelativeTime'
import { ColourEditor } from '@/Component/detail/ColourEditor'
import { EntityDetailPage } from '@/Component/detail/EntityDetailPage'
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

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const { inventoryId = '' } = useParams<{ inventoryId: string }>()
  const em = useEntityManager()
  const item = em.inventory.find(inventoryId)

  // Archived and soft-deleted items are off the list, so they are off here too.
  if (item === null || !item.isActive()) {
    return (
      <NotFoundCard
        message={t('inventoryDetail.notFound')}
        backTo={BACK_TO}
        backLabel={t('inventoryDetail.backToList')}
      />
    )
  }
  return <InventoryDetail item={item} />
}

interface InventoryDetailProps {
  item: InventoryItem
}

function InventoryDetail({ item }: InventoryDetailProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const handleArchive = () => {
    // Cascades to the item's active lots.
    new LifecycleService(em).archiveInventory(item.id)
    setConfirmOpen(false)
    void navigate(BACK_TO)
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
      actions={
        <button
          type="button"
          data-testid="entity-detail-delete"
          className="btn-secondary"
          onClick={() => setConfirmOpen(true)}
        >
          {t('lifecycle.archive')}
        </button>
      }
    >
      <div className="space-y-8">
        <QtyEditor itemId={item.id} qtyCurrent={item.qtyCurrent} />
        <ThresholdEditor item={item} />
        <ColourEditor itemId={item.id} colour={item.colour} />
        <InventoryLotsTable rows={lotRows} />
        <InventoryConsumptionTable rows={consumptionRows} />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={t('inventoryDetail.archiveConfirmTitle')}
        message={t('inventoryDetail.archiveConfirmMessage', {
          name: item.name,
        })}
        confirmLabel={t('lifecycle.archive')}
        onConfirm={handleArchive}
        onCancel={() => setConfirmOpen(false)}
      />
    </EntityDetailPage>
  )
}
