import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { updateJobStatus } from '@/services/job/updateJobStatus'
import { useSnapshotPieces } from '@/stores/workbookStore'
import type { Job, JobStatus } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import {
  canMarkJobPaid,
  incomeAmountForPaidJob,
} from '@/utils/jobPiecePricing'

export type JobStatusSelectResult =
  | 'dialog-opened'
  | 'blocked'
  | 'committed'

export function useJobStatusFlow(
  spreadsheetId: string | null,
  flowOptions?: {
    afterStatusCommit?: (job: Job) => void
    onStatusFlowCancelled?: () => void
    /** Called when a status update fails after the user confirmed (e.g. network). */
    onStatusCommitError?: () => void
  },
) {
  const { t } = useTranslation()
  const pieces = useSnapshotPieces()
  const [cancelDialogJob, setCancelDialogJob] = useState<Job | null>(null)
  const [paidDialogJob, setPaidDialogJob] = useState<Job | null>(null)
  const [paidCreateTransaction, setPaidCreateTransaction] = useState(true)
  const [leavePaidPending, setLeavePaidPending] = useState<{
    job: Job
    next: JobStatus
  } | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const commitStatus = async (
    job: Job,
    next: JobStatus,
    statusOpts?: { paidPrice?: number; createIncomeTransaction?: boolean },
  ) => {
    if (!spreadsheetId) return
    setStatusUpdatingId(job.id)
    setStatusError(null)
    try {
      const nextJob = await updateJobStatus(
        spreadsheetId,
        job,
        next,
        statusOpts,
      )
      flowOptions?.afterStatusCommit?.(nextJob)
    } catch {
      setStatusError(t('errors.actionFailed'))
      flowOptions?.onStatusCommitError?.()
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleStatusSelect = async (
    job: Job,
    next: JobStatus,
  ): Promise<JobStatusSelectResult> => {
    if (next === job.status) return 'committed'
    if (next === 'paid') {
      if (!canMarkJobPaid(job.id, pieces)) {
        setStatusError(t('jobs.paidPiecesIncomplete'))
        return 'blocked'
      }
      setPaidCreateTransaction(true)
      setPaidDialogJob(job)
      return 'dialog-opened'
    }
    if (job.status === 'paid') {
      setLeavePaidPending({ job, next })
      return 'dialog-opened'
    }
    if (next === 'cancelled') {
      if (!canMarkJobPaid(job.id, pieces)) {
        setStatusError(t('jobs.paidPiecesIncomplete'))
        return 'blocked'
      }
      setCancelDialogJob(job)
      return 'dialog-opened'
    }
    await commitStatus(job, next)
    return 'committed'
  }

  const confirmPaid = async () => {
    if (!paidDialogJob) return
    let amount: number
    try {
      amount = incomeAmountForPaidJob(paidDialogJob.id, pieces)
    } catch {
      setStatusError(t('errors.actionFailed'))
      return
    }
    await commitStatus(paidDialogJob, 'paid', {
      paidPrice: amount,
      createIncomeTransaction: paidCreateTransaction,
    })
    setPaidDialogJob(null)
    setPaidCreateTransaction(true)
  }

  const confirmCancelled = async () => {
    if (!cancelDialogJob) return
    await commitStatus(cancelDialogJob, 'cancelled')
    setCancelDialogJob(null)
  }

  const confirmLeavePaid = async () => {
    if (!leavePaidPending) return
    await commitStatus(leavePaidPending.job, leavePaidPending.next)
    setLeavePaidPending(null)
  }

  const paidMessage =
    paidDialogJob != null
      ? t('jobs.confirmPaidWithPrice', {
          price: formatCurrency(
            incomeAmountForPaidJob(paidDialogJob.id, pieces),
          ),
        })
      : ''

  const statusDialogs = (
    <>
      <ConfirmDialog
        isOpen={!!paidDialogJob}
        title={t('jobs.confirmPaidTitle')}
        message={paidMessage}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        confirmDisabled={false}
        onCancel={() => {
          flowOptions?.onStatusFlowCancelled?.()
          setPaidDialogJob(null)
          setPaidCreateTransaction(true)
        }}
        onConfirm={() => {
          void confirmPaid()
        }}
      >
        {paidDialogJob ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={paidCreateTransaction}
              onChange={(e) => setPaidCreateTransaction(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t('jobs.paidCreateTransactionLabel')}</span>
          </label>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!cancelDialogJob}
        title={t('jobs.confirmCancelTitle')}
        message={t('jobs.confirmCancelMessage')}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          flowOptions?.onStatusFlowCancelled?.()
          setCancelDialogJob(null)
        }}
        onConfirm={() => {
          void confirmCancelled()
        }}
      />

      <ConfirmDialog
        isOpen={!!leavePaidPending}
        title={t('jobs.confirmLeavePaidTitle')}
        message={t('jobs.confirmLeavePaidMessage', {
          status: leavePaidPending
            ? t(`jobs.status.${leavePaidPending.next}`)
            : '',
        })}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          flowOptions?.onStatusFlowCancelled?.()
          setLeavePaidPending(null)
        }}
        onConfirm={() => {
          void confirmLeavePaid()
        }}
      />
    </>
  )

  return {
    handleStatusSelect,
    statusError,
    statusUpdatingId,
    statusDialogs,
  }
}
