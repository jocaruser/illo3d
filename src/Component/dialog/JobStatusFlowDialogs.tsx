import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import type { JobStatusFlow } from '@/Hook/useJobStatusFlow'
import { formatCurrency } from '@/Service/Pricing/money'

interface JobStatusFlowDialogsProps {
  flow: JobStatusFlow
}

/**
 * Renders whichever dialog `flow` is waiting on. Split from the hook so every
 * page driving a status change shows the same prompts.
 */
export function JobStatusFlowDialogs({ flow }: JobStatusFlowDialogsProps) {
  const { t } = useTranslation()
  const { dialog } = flow

  if (dialog === null) return null

  if (dialog.kind === 'paid') {
    return (
      <ConfirmDialog
        open
        title={t('jobs.confirmPaidTitle')}
        message={t('jobs.confirmPaidWithPrice', {
          price: formatCurrency(dialog.total),
        })}
        busy={flow.busy}
        onConfirm={flow.confirm}
        onCancel={flow.cancel}
      >
        <label className="mt-4 flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
            checked={flow.createIncome}
            onChange={(event) => flow.setCreateIncome(event.target.checked)}
          />
          {t('jobs.paidCreateTransactionLabel')}
        </label>
      </ConfirmDialog>
    )
  }

  if (dialog.kind === 'cancelled') {
    return (
      <ConfirmDialog
        open
        title={t('jobs.confirmCancelTitle')}
        message={t('jobs.confirmCancelMessage')}
        busy={flow.busy}
        onConfirm={flow.confirm}
        onCancel={flow.cancel}
      />
    )
  }

  return (
    <ConfirmDialog
      open
      title={t('jobs.confirmLeavePaidTitle')}
      message={t('jobs.confirmLeavePaidMessage', {
        status: t(`jobs.status.${dialog.next}`),
      })}
      busy={flow.busy}
      onConfirm={flow.confirm}
      onCancel={flow.cancel}
    />
  )
}
