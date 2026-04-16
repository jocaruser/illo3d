import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Job, JobStatus } from '@/types/money'
import { compareJobsForKanban } from '@/utils/kanbanJobSort'
import { KanbanColumn } from './KanbanColumn'
import { endKanbanJobDrag } from './kanbanDnd'

const STATUSES: JobStatus[] = [
  'draft',
  'in_progress',
  'delivered',
  'paid',
  'cancelled',
]

function isActiveJob(j: Job): boolean {
  return j.archived !== 'true' && j.deleted !== 'true'
}

interface KanbanBoardProps {
  jobs: Job[]
  clientsById: Map<string, string>
  onJobMoveToStatus: (
    job: Job,
    nextStatus: JobStatus,
    insertBeforeId: string | null,
  ) => void
  statusUpdatingId: string | null
}

export function KanbanBoard({
  jobs,
  clientsById,
  onJobMoveToStatus,
  statusUpdatingId,
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
      if (!isActiveJob(job)) continue
      const list = map.get(job.status)
      if (list) list.push(job)
    }
    for (const s of STATUSES) {
      map.get(s)!.sort(compareJobsForKanban)
    }
    return map
  }, [jobs])

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

  const handleDrop = (
    jobId: string,
    targetStatus: JobStatus,
    insertBeforeId: string | null,
  ) => {
    const job = jobs.find((j) => j.id === jobId && isActiveJob(j))
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
            clientsById={clientsById}
            columnTitle={titleForStatus(status)}
            onDropJob={handleDrop}
            statusUpdatingId={statusUpdatingId}
          />
        ))}
      </div>
    </div>
  )
}
