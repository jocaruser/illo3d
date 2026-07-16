import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { DialogShell } from '@/Component/dialog/DialogShell'

interface CreateConfirmModalProps {
  open: boolean
  /** Folder the shop would be created in — named in the warning. */
  folderName: string
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Guards the destructive half of "open a local folder": the picked folder holds
 * no shop metadata, so continuing writes a fresh shop over whatever is there.
 *
 * Deliberately not `ConfirmDialog` — the e2e suite drives the confirm button by
 * `data-testid`, which that primitive does not expose.
 */
export function CreateConfirmModal({
  open,
  folderName,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: CreateConfirmModalProps) {
  const { t } = useTranslation()
  const titleId = useId()

  return (
    <DialogShell open={open} onClose={onCancel} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-xl font-semibold text-text">
        {t('wizard.createConfirmTitle')}
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        {t('wizard.createConfirmMessage', { name: folderName })}
      </p>

      {error !== undefined && error !== '' && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          data-testid="wizard-create-confirm-cancel"
          className="btn-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {t('wizard.createConfirmCancel')}
        </button>
        <button
          type="button"
          data-testid="wizard-create-confirm-action"
          className="btn-primary"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy && <LoadingSpinner />}
          {busy ? t('wizard.creating') : t('wizard.createConfirmAction')}
        </button>
      </div>
    </DialogShell>
  )
}
