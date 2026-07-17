import { Job, type JobStatus } from '@/Entity/Job'
import { Transaction } from '@/Entity/Transaction'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoDay, isoInstant } from './Clock'
import { jobPricingState } from './Pricing/jobPricing'

const BOARD_ORDER_SPACING = 1000
const DAY_MS = 24 * 60 * 60 * 1000

export interface CreateJobInput {
  clientId: string
  description: string
  /** `YYYY-MM-DD`; wins over `defaultDueDateDays`. */
  dueDate?: string
  /** Shop metadata `defaultDueDate`: days from now used to prefill the due date. */
  defaultDueDateDays?: number
}

export interface UpdateJobInput {
  clientId: string
  description: string
  dueDate?: string
}

export interface UpdateJobStatusOptions {
  createIncomeTransaction?: boolean
  incomeAmount?: number
}

export type JobResult = { ok: true; job: Job } | { ok: false; error: string }

export type KanbanDialog = 'paid' | 'cancelled' | 'leave-paid'

export type KanbanDropResult =
  | { kind: 'ok' }
  | { kind: 'needs-dialog'; dialog: KanbanDialog }

export class JobService {
  constructor(private readonly em: EntityManager) {}

  createJob(input: CreateJobInput): JobResult {
    const invalid = validateJobInput(input)
    if (invalid !== null) return { ok: false, error: invalid }
    const job = new Job()
    job.id = this.em.jobs.nextId()
    job.clientId = input.clientId
    job.description = input.description.trim()
    job.status = 'draft'
    job.boardOrder = this.maxDraftBoardOrder() + BOARD_ORDER_SPACING
    job.createdAt = isoInstant(this.em.clock)
    job.dueDate = this.resolveDueDate(input)
    this.em.jobs.save(job)
    return { ok: true, job }
  }

  updateJob(id: string, input: UpdateJobInput): JobResult {
    const job = this.em.jobs.find(id)
    if (job === null) return { ok: false, error: 'jobs.jobNotFound' }
    const invalid = validateJobInput(input)
    if (invalid !== null) return { ok: false, error: invalid }
    job.clientId = input.clientId
    job.description = input.description.trim()
    job.dueDate = input.dueDate ?? ''
    this.em.jobs.save(job)
    return { ok: true, job }
  }

  /**
   * Change a job's status. Moving to paid/cancelled requires complete pricing
   * on every counting piece; paying with `createIncomeTransaction` appends an
   * income transaction for the derived (or caller-provided) total.
   */
  updateJobStatus(job: Job, newStatus: JobStatus, options?: UpdateJobStatusOptions): JobResult {
    const current = this.em.jobs.find(job.id)
    if (current === null) return { ok: false, error: 'jobs.jobNotFound' }

    const pricing = jobPricingState(this.em.pieces.findCountingByJob(current.id))
    if ((newStatus === 'paid' || newStatus === 'cancelled') && !pricing.complete) {
      return { ok: false, error: 'jobs.paidPiecesIncomplete' }
    }
    const derivedTotal = pricing.complete ? pricing.total : 0

    const becomesPaid = newStatus === 'paid' && current.status !== 'paid'
    current.status = newStatus
    this.em.jobs.save(current)

    if (becomesPaid && options?.createIncomeTransaction === true) {
      const amount = options.incomeAmount ?? derivedTotal
      const transaction = new Transaction()
      transaction.id = this.em.transactions.nextId()
      transaction.date = isoDay(this.em.clock)
      transaction.type = 'income'
      transaction.amount = amount
      transaction.category = 'job'
      transaction.concept = current.description
      transaction.refType = 'job'
      transaction.refId = current.id
      transaction.clientId = current.clientId
      this.em.transactions.save(transaction)
    }
    return { ok: true, job: current }
  }

  /**
   * Handle a kanban drag-and-drop. Same-column drops reorder in place;
   * cross-column drops that need user confirmation (into paid/cancelled, or
   * out of paid) return `needs-dialog` without committing anything.
   */
  applyKanbanDrop(
    jobId: string,
    targetStatus: JobStatus,
    insertBeforeJobId?: string,
  ): KanbanDropResult {
    const job = this.em.jobs.find(jobId)
    if (job === null || !job.isActive() || insertBeforeJobId === jobId) return { kind: 'ok' }

    if (job.status === targetStatus) {
      this.reorderColumns([targetStatus], jobId, targetStatus, insertBeforeJobId ?? null)
      return { kind: 'ok' }
    }

    const dialog = kanbanDialogFor(job.status, targetStatus)
    if (dialog !== null) return { kind: 'needs-dialog', dialog }

    const fromStatus = job.status
    job.status = targetStatus
    this.em.jobs.save(job)
    this.reorderColumns([fromStatus, targetStatus], jobId, targetStatus, insertBeforeJobId ?? null)
    return { kind: 'ok' }
  }

  private resolveDueDate(input: CreateJobInput): string {
    if (input.dueDate !== undefined && input.dueDate !== '') return input.dueDate
    if (input.defaultDueDateDays === undefined) return ''
    return new Date(this.em.clock.now().getTime() + input.defaultDueDateDays * DAY_MS)
      .toISOString()
      .slice(0, 10)
  }

  private maxDraftBoardOrder(): number {
    let max = 0
    for (const job of this.em.jobs.findAll()) {
      if (job.status !== 'draft') continue
      const order = job.boardOrder ?? 0
      if (order > max) max = order
    }
    return max
  }

  /** Rewrite each column's boardOrder in 1000 spacing after a move. */
  private reorderColumns(
    statuses: JobStatus[],
    movedId: string,
    movedTarget: JobStatus,
    insertBeforeId: string | null,
  ): void {
    const jobs = this.em.jobs.findAll()
    const moved = jobs.find((job) => job.id === movedId) as Job
    for (const status of statuses) {
      const column = jobs
        .filter((job) => job.status === status && job.id !== movedId)
        .sort(compareJobsForKanban)
      if (status === movedTarget) {
        const index = insertBeforeId === null
          ? column.length
          : column.findIndex((job) => job.id === insertBeforeId)
        column.splice(index === -1 ? column.length : index, 0, moved)
      }
      column.forEach((job, position) => {
        const order = (position + 1) * BOARD_ORDER_SPACING
        if ((job.boardOrder ?? 0) === order) return
        job.boardOrder = order
        this.em.jobs.save(job)
      })
    }
  }
}

function validateJobInput(input: { clientId: string; description: string }): string | null {
  if (input.clientId.trim() === '') return 'jobs.validation.clientRequired'
  if (input.description.trim() === '') return 'jobs.validation.required'
  return null
}

function kanbanDialogFor(from: JobStatus, target: JobStatus): KanbanDialog | null {
  if (target === 'paid') return 'paid'
  if (from === 'paid') return 'leave-paid'
  if (target === 'cancelled') return 'cancelled'
  return null
}

/** Column order: explicit boardOrder, then newest first, then id. */
export function compareJobsForKanban(a: Job, b: Job): number {
  const orderA = a.boardOrder ?? 0
  const orderB = b.boardOrder ?? 0
  if (orderA !== orderB) return orderA - orderB
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  return a.id.localeCompare(b.id)
}
