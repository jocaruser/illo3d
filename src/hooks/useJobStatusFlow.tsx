import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { updateJobStatus } from '@/services/job/updateJobStatus'
import type { Job, JobStatus } from '@/types/money'
import { formatCurrency } from '@/utils/money'

export function jobHasPrice(job: Job): boolean {
  return (
    job.price !== undefined &&
    job.price !== null &&
    !Number.isNaN(Number(job.price))
  )
}

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
  const [cancelDialogJob, setCancelDialogJob] = useState<Job | null>(null)
  const [paidDialogJob, setPaidDialogJob] = useState<Job | null>(null)
  const [paidPriceInput, setPaidPriceInput] = useState('')
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

  const handleStatusSelect = async (job: Job, next: JobStatus) => {
    if (next === job.status) return
    if (next === 'paid') {
      setPaidPriceInput('')
      setPaidCreateTransaction(true)
      setPaidDialogJob(job)
      return
    }
    if (job.status === 'paid') {
      setLeavePaidPending({ job, next })
      return
    }
    if (next === 'cancelled') {
      setCancelDialogJob(job)
      return
    }
    await commitStatus(job, next)
  }

  const paidConfirmDisabled = (): boolean => {
    if (!paidDialogJob) return true
    if (jobHasPrice(paidDialogJob)) return false
    const n = parseFloat(paidPriceInput)
    return Number.isNaN(n) || n < 0
  }

  const confirmPaid = async () => {
    if (!paidDialogJob) return
    if (!jobHasPrice(paidDialogJob) && paidConfirmDisabled()) return
    const options: {
      paidPrice?: number
      createIncomeTransaction: boolean
    } = {
      createIncomeTransaction: paidCreateTransaction,
    }
    if (!jobHasPrice(paidDialogJob)) {
      options.paidPrice = parseFloat(paidPriceInput)
    }
    await commitStatus(paidDialogJob, 'paid', options)
    setPaidDialogJob(null)
    setPaidPriceInput('')
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

  const statusDialogs = (
    <>
      <ConfirmDialog
        isOpen={!!paidDialogJob}
        title={t('jobs.confirmPaidTitle')}
        message={
          paidDialogJob && jobHasPrice(paidDialogJob)
            ? t('jobs.confirmPaidWithPrice', {
                price: formatCurrency(paidDialogJob.price!),
              })
            : t('jobs.confirmPaidNeedPrice')
        }
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        confirmDisabled={paidConfirmDisabled()}
        onCancel={() => {
          flowOptions?.onStatusFlowCancelled?.()
          setPaidDialogJob(null)
          setPaidPriceInput('')
          setPaidCreateTransaction(true)
        }}
        onConfirm={() => {
          void confirmPaid()
        }}
      >
        {paidDialogJob && !jobHasPrice(paidDialogJob) ? (
          <div className="mb-2">
            <label
              htmlFor="paid-price-input"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('jobs.paidPriceLabel')}
            </label>
            <input
              id="paid-price-input"
              type="number"
              step="0.01"
              min="0"
              value={paidPriceInput}
              onChange={(e) => setPaidPriceInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : null}
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
