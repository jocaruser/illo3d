import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertBox } from '@/Component/AlertBox'
import { jobBenefit } from '@/Component/dashboard/jobBenefit'
import { JobStatusFlowDialogs } from '@/Component/dialog/JobStatusFlowDialogs'
import { JOB_STATUSES, type Job, type JobStatus } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useJobStatusFlow } from '@/Hook/useJobStatusFlow'
import { useShopMetadata } from '@/Hook/useShopMetadata'
import { compareJobsForKanban, JobService } from '@/Service/JobService'
import {
  daysSinceDueDate,
  dueDateBand,
  shouldHideJobOnKanban,
  DEFAULT_KANBAN_STALE_DAYS,
} from '@/Service/Pricing/dueDate'
import { jobPricingState } from '@/Service/Pricing/jobPricing'
import type { KanbanCard } from './JobCard'
import { KanbanColumn } from './KanbanColumn'
import type { KanbanDropTarget } from './kanbanDnd'

const COLUMN_LABEL_KEYS: Record<JobStatus, string> = {
  draft: 'dashboard.kanban.draft',
  in_progress: 'dashboard.kanban.inProgress',
  delivered: 'dashboard.kanban.delivered',
  paid: 'dashboard.kanban.paid',
  cancelled: 'dashboard.kanban.cancelled',
}

/**
 * The job kanban: one column per job status, cards carrying the piece
 * progress that the piece-board experiment was reaching for without giving
 * up the job as the unit of work.
 */
export function KanbanBoard() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const { metadata } = useShopMetadata()
  const flow = useJobStatusFlow()
  const service = useMemo(() => new JobService(em), [em])
  // Drops mutate the snapshot in place; bumping re-reads the board.
  const [, setRevision] = useState(0)

  const staleDays =
    metadata?.kanban?.autoCardsHideAfterXDays ?? DEFAULT_KANBAN_STALE_DAYS
  const clientNames = new Map(
    em.clients.findAll().map((client) => [client.id, client.name])
  )
  const pieces = em.pieces.findAll()
  const pieceItems = em.pieceItems.findAll()
  const inventory = em.inventory.findAll()
  const lots = em.lots.findAll()

  const buildCard = (job: Job): KanbanCard => {
    const countingPieces = em.pieces.findCountingByJob(job.id)
    return {
      job,
      clientName: clientNames.get(job.clientId) ?? '',
      pricing: jobPricingState(countingPieces),
      benefit: jobBenefit(job, pieces, pieceItems, inventory, lots),
      piecesDone: countingPieces.filter((piece) => piece.status === 'done')
        .length,
      piecesTotal: countingPieces.length,
      dueBand: dueDateBand(daysSinceDueDate(job, em.clock)),
      dueDay: job.effectiveDueDate().slice(0, 10),
    }
  }

  const cards: KanbanCard[] = []
  for (const job of em.jobs.findActive()) {
    if (shouldHideJobOnKanban(job, staleDays, em.clock)) continue
    cards.push(buildCard(job))
  }

  const jobsById = new Map(cards.map((card) => [card.job.id, card.job]))

  const columnCards = (status: JobStatus): KanbanCard[] =>
    cards
      .filter((card) => card.job.status === status)
      .sort((a, b) => compareJobsForKanban(a.job, b.job))

  const handleDropCard = (jobId: string, target: KanbanDropTarget): void => {
    const job = jobsById.get(jobId)
    if (job === undefined) return
    const result = service.applyKanbanDrop(
      job.id,
      target.status,
      target.insertBeforeJobId
    )
    if (result.kind === 'needs-dialog') {
      flow.requestStatusChange(job, target.status)
      return
    }
    setRevision((revision) => revision + 1)
  }

  return (
    <div>
      {flow.error !== null && (
        <AlertBox variant="danger" className="mb-3">
          {t(flow.error)}
        </AlertBox>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={t(COLUMN_LABEL_KEYS[status])}
            cards={columnCards(status)}
            onDropCard={handleDropCard}
            onStatusChange={flow.requestStatusChange}
          />
        ))}
      </div>

      <JobStatusFlowDialogs flow={flow} />
    </div>
  )
}
