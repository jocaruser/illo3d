import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogShell } from './DialogShell'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  error?: string
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  error,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  return (
    <DialogShell open={open} onClose={onCancel} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-xl font-semibold text-text">
        {title}
      </h2>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
      {children}
      {error !== undefined && error !== '' && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button type="button" className="btn-primary" disabled={busy} onClick={onConfirm}>
          {busy ? t('common.submitting') : (confirmLabel ?? t('common.confirm'))}
        </button>
      </div>
    </DialogShell>
  )
}
