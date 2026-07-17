import { useMemo, useState } from 'react'
import type { Job, JobStatus } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { JobService } from '@/Service/JobService'
import { jobPricingState } from '@/Service/Pricing/jobPricing'

/**
 * The dialog a status change is waiting on.
 *
 * `paid` always carries a total: the flow refuses to open it unless every
 * counting piece is priced. The confirmation dialogs for leaving `paid` may
 * appear while pricing is still incomplete, so their total is nullable.
 */
export type JobStatusDialog =
  | { kind: 'paid'; job: Job; next: JobStatus; total: number }
  | {
      kind: 'cancelled' | 'leave-paid'
      job: Job
      next: JobStatus
      total: number | null
    }

export interface JobStatusFlow {
  /** Opens the dialog the transition needs, or commits it when none is needed. */
  requestStatusChange(job: Job, next: JobStatus): void
  dialog: JobStatusDialog | null
  createIncome: boolean
  setCreateIncome(value: boolean): void
  confirm(): void
  cancel(): void
  /** i18n key, not a message. */
  error: string | null
  busy: boolean
}

/**
 * The one place job status transitions are decided, for the dashboard kanban,
 * the jobs list and the job detail page alike.
 *
 * - `→ paid` / `→ cancelled` demand complete pricing; otherwise the status is
 *   left alone and `error` names the reason.
 * - `→ paid` confirms the derived total and offers to book the income.
 * - Leaving `paid` warns that re-paying would book a second income row.
 * - draft ↔ in_progress ↔ delivered commit straight away.
 */
export function useJobStatusFlow(): JobStatusFlow {
  const em = useEntityManager()
  const service = useMemo(() => new JobService(em), [em])
  const [dialog, setDialog] = useState<JobStatusDialog | null>(null)
  const [createIncome, setCreateIncome] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Committing mutates the workbook in place; bumping forces consumers to re-read.
  const [, setRevision] = useState(0)

  const commit = (
    target: { job: Job; next: JobStatus },
    options?: { incomeAmount: number }
  ): void => {
    setBusy(true)
    const result =
      options === undefined
        ? service.updateJobStatus(target.job, target.next)
        : service.updateJobStatus(target.job, target.next, {
            createIncomeTransaction: createIncome,
            incomeAmount: options.incomeAmount,
          })
    setBusy(false)
    if (result.ok) {
      setError(null)
      setRevision((revision) => revision + 1)
      return
    }
    setError(result.error)
  }

  const requestStatusChange = (job: Job, next: JobStatus): void => {
    setError(null)
    if (job.status === next) return

    const pricing = jobPricingState(em.pieces.findCountingByJob(job.id))

    if (next === 'paid' || next === 'cancelled') {
      if (!pricing.complete) {
        setError('jobs.paidPiecesIncomplete')
        return
      }
      if (next === 'paid') {
        setCreateIncome(true)
        setDialog({ kind: 'paid', job, next, total: pricing.total })
        return
      }
      // Leaving paid is the graver warning: it owns the prompt, no double dialog.
      const kind = job.status === 'paid' ? 'leave-paid' : 'cancelled'
      setDialog({ kind, job, next, total: pricing.total })
      return
    }

    if (job.status === 'paid') {
      setDialog({
        kind: 'leave-paid',
        job,
        next,
        total: pricing.complete ? pricing.total : null,
      })
      return
    }

    commit({ job, next })
  }

  const confirm = (): void => {
    if (dialog === null) return
    setDialog(null)
    if (dialog.kind === 'paid') {
      commit(
        { job: dialog.job, next: dialog.next },
        { incomeAmount: dialog.total }
      )
      return
    }
    commit({ job: dialog.job, next: dialog.next })
  }

  const cancel = (): void => {
    setDialog(null)
  }

  return {
    requestStatusChange,
    dialog,
    createIncome,
    setCreateIncome,
    confirm,
    cancel,
    error,
    busy,
  }
}
