import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { completeJob } from '@/services/job/completeJob'
import { useSnapshotPieces } from '@/stores/workbookStore'
import type { Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import {
  canMarkJobPaid,
  incomeAmountForPaidJob,
} from '@/utils/jobPiecePricing'
import { toast } from '@/lib/toast'

export function useJobCompleteFlow(
  spreadsheetId: string | null,
  flowOptions?: {
    afterComplete?: (job: Job) => void
    onCompleteCancelled?: () => void
    onCompleteError?: () => void
  },
) {
  const { t } = useTranslation()
  const pieces = useSnapshotPieces()
  const [completeDialogJob, setCompleteDialogJob] = useState<Job | null>(null)
  const [createTransaction, setCreateTransaction] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const handleCompleteClick = async (job: Job): Promise<boolean> => {
    if (!spreadsheetId) return false
    
    if (job.completed) {
      // Already completed
      return true
    }
    
    if (!canMarkJobPaid(job.id, pieces)) {
      setCompleteError(t('jobs.paidPiecesIncomplete'))
      return false
    }
    
    setCreateTransaction(true)
    setCompleteDialogJob(job)
    return true
  }

  const confirmComplete = async () => {
    if (!completeDialogJob || !spreadsheetId) return
    
    try {
      incomeAmountForPaidJob(completeDialogJob.id, pieces)
    } catch {
      toast.error(t('errors.actionFailed'))
      return
    }
    
    setCompletingId(completeDialogJob.id)
    try {
      await completeJob(
        spreadsheetId,
        completeDialogJob.id,
        createTransaction,
      )
      flowOptions?.afterComplete?.(completeDialogJob)
      setCompleteDialogJob(null)
    } catch {
      toast.error(t('errors.actionFailed'))
      flowOptions?.onCompleteError?.()
    } finally {
      setCompletingId(null)
    }
  }

  const cancelComplete = () => {
    setCompleteDialogJob(null)
    flowOptions?.onCompleteCancelled?.()
  }

  const completeDialogs = (
    <>
      {completeDialogJob && (
        <ConfirmDialog
          isOpen
          title={t('jobs.completeConfirmTitle')}
          message={t('jobs.completeConfirmMessage', {
            amount: formatCurrency(
              (() => {
                try {
                  return incomeAmountForPaidJob(completeDialogJob.id, pieces)
                } catch {
                  return 0
                }
              })(),
            ),
          })}
          onCancel={cancelComplete}
          onConfirm={confirmComplete}
          confirmLabel={t('jobs.complete')}
          cancelLabel={t('jobs.cancel')}
        >
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={createTransaction}
              onChange={(e) => setCreateTransaction(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">{t('jobs.createIncomeTransaction')}</span>
          </label>
        </ConfirmDialog>
      )}
    </>
  )

  return {
    handleCompleteClick,
    completeError,
    setCompleteError,
    completingId,
    completeDialogs,
  }
}