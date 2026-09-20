import { useMemo, useReducer, useState } from 'react'
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
import { ParentDetailLifecycleActions } from '@/Component/detail/ParentDetailLifecycleActions'
import { QtyEditor } from '@/Component/detail/QtyEditor'
import { ThresholdEditor } from '@/Component/detail/ThresholdEditor'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import type { InventoryItem } from '@/Entity/InventoryItem'
import { useEntityManager } from '@/Hook/useEntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import { formatCurrency } from '@/Service/Pricing/money'
import { toast } from '@/Component/Toast'

const BACK_TO = '/inventory'

export function InventoryDetailPage() {
  const { t } = useTranslation()
  const { inventoryId = '' } = useParams<{ inventoryId: string }>()
  const em = useEntityManager()
  const item = em.inventory.find(inventoryId)

  if (item === null || item.isDeleted()) {
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
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const liveItem = useMemo(() => {
    void revision
    return em.inventory.find(item.id) ?? item
  }, [em, item, revision])

  const readOnly = liveItem.isArchived()

  const lots = useMemo(
    () => em.lots.findActiveByInventory(liveItem.id),
    [em, liveItem]
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
      em.pieceItems.findActiveByInventory(liveItem.id).map((line) => {
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
    [em, liveItem]
  )

  const avgUnitCost = computeAvgUnitCost(lots)

  const handleArchive = () => {
    new LifecycleService(em).archiveInventory(liveItem.id)
    toast.success(t('toast.changeApplied'))
    setArchiveOpen(false)
    void navigate(BACK_TO)
  }

  const unarchiveItem = () => {
    new LifecycleService(em).restoreInventory(liveItem.id)
    toast.success(t('toast.changeApplied'))
    bump()
  }

  const handleSoftDelete = () => {
    new LifecycleService(em).softDeleteInventory(liveItem.id)
    toast.success(t('toast.changeApplied'))
    setDeleteOpen(false)
    void navigate(BACK_TO)
  }

  return (
    <EntityDetailPage
      backTo={BACK_TO}
      backLabel={t('inventoryDetail.backToList')}
      title={liveItem.name}
      fields={[
        { label: t('inventory.colId'), value: liveItem.id },
        {
          label: t('inventory.typeLabel'),
          value: t(`inventory.type.${liveItem.type}`),
        },
        {
          label: t('inventory.avgUnitCost'),
          value: avgUnitCost === null ? '—' : formatCurrency(avgUnitCost),
        },
        {
          label: t('inventory.createdAt'),
          value: <RelativeTime value={liveItem.createdAt} />,
        },
      ]}
      actions={
        <ParentDetailLifecycleActions
          canArchive={!readOnly}
          canUnarchive={readOnly}
          canSoftDelete={readOnly}
          onArchive={() => setArchiveOpen(true)}
          onUnarchive={unarchiveItem}
          onSoftDelete={() => setDeleteOpen(true)}
        />
      }
    >
      <div className="space-y-8">
        <QtyEditor
          itemId={liveItem.id}
          qtyCurrent={liveItem.qtyCurrent}
          readOnly={readOnly}
        />
        <ThresholdEditor item={liveItem} readOnly={readOnly} />
        <ColourEditor itemId={liveItem.id} colour={liveItem.colour} readOnly={readOnly} />
        <InventoryLotsTable rows={lotRows} />
        <InventoryConsumptionTable rows={consumptionRows} />
      </div>
      <ConfirmDialog
        open={archiveOpen}
        title={t('inventoryDetail.archiveConfirmTitle')}
        message={t('inventoryDetail.archiveConfirmMessage', {
          name: liveItem.name,
        })}
        confirmLabel={t('lifecycle.archive')}
        onConfirm={handleArchive}
        onCancel={() => setArchiveOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={t('clients.deleteConfirmTitle')}
        message={t('clients.deleteConfirmMessage', { name: liveItem.name })}
        confirmLabel={t('lifecycle.softDelete')}
        onConfirm={handleSoftDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </EntityDetailPage>
  )
}
