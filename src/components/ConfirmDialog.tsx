import { DialogShell } from './DialogShell'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  children?: React.ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  confirmDisabled?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  return (
    <DialogShell isOpen={isOpen} onClose={onCancel} title={title} overlayClassName="z-[60]">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      {children}
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
          className="btn-primary disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  )
}
