import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Inventory, Job, JobStatus, Lot, Piece, PieceItem } from '@/types/money'
import { compareJobsForKanban } from '@/utils/kanbanJobSort'
import { KanbanColumn } from './KanbanColumn'
import { endKanbanJobDrag } from './kanbanDnd'
import { isActiveRow } from '@/lib/entityFilters'
import { shouldHideJobOnKanban } from '@/utils/jobKanbanVisibility'

const STATUSES: JobStatus[] = [
  'draft',
  'in_progress',
  'delivered',
  'paid',
  'cancelled',
]

interface KanbanBoardProps {
  jobs: Job[]
  pieces: Piece[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  lots: Lot[]
  clientsById: Map<string, string>
  onJobMoveToStatus: (
    job: Job,
    nextStatus: JobStatus,
    insertBeforeId: string | null,
  ) => void
  statusUpdatingId: string | null
  kanbanStaleDays?: number
}

export function KanbanBoard({
  jobs,
  pieces,
  pieceItems,
  inventory,
  lots,
  clientsById,
  onJobMoveToStatus,
  statusUpdatingId,
  kanbanStaleDays,
}: KanbanBoardProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const clear = () => endKanbanJobDrag()
    document.addEventListener('dragend', clear, true)
    return () => document.removeEventListener('dragend', clear, true)
  }, [])

  const byStatus = useMemo(() => {
    const map = new Map<JobStatus, Job[]>()
    for (const s of STATUSES) {
      map.set(s, [])
    }
    for (const job of jobs) {
      if (!isActiveRow(job)) continue
      if (shouldHideJobOnKanban(job, kanbanStaleDays)) continue
      const list = map.get(job.status)
      if (list) list.push(job)
    }
    for (const s of STATUSES) {
      map.get(s)!.sort(compareJobsForKanban)
    }
    return map
  }, [jobs, kanbanStaleDays])

  const titleForStatus = (s: JobStatus): string => {
    switch (s) {
      case 'draft':
        return t('dashboard.kanban.draft')
      case 'in_progress':
        return t('dashboard.kanban.inProgress')
      case 'delivered':
        return t('dashboard.kanban.delivered')
      case 'paid':
        return t('dashboard.kanban.paid')
      case 'cancelled':
        return t('dashboard.kanban.cancelled')
      default:
        return s
    }
  }

  const statusOptions = STATUSES.map((s) => ({ value: s, label: titleForStatus(s) }))

  const handleDrop = (
    jobId: string,
    targetStatus: JobStatus,
    insertBeforeId: string | null,
  ) => {
    const job = jobs.find((j) => j.id === jobId && isActiveRow(j))
    if (!job) return
    onJobMoveToStatus(job, targetStatus, insertBeforeId)
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-min items-stretch gap-3">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={byStatus.get(status) ?? []}
            pieces={pieces}
            pieceItems={pieceItems}
            inventory={inventory}
            lots={lots}
            clientsById={clientsById}
            columnTitle={titleForStatus(status)}
            onDropJob={handleDrop}
            statusUpdatingId={statusUpdatingId}
            statusOptions={statusOptions}
          />
        ))}
      </div>
    </div>
  )
}
