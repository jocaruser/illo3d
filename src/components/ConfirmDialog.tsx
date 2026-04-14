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
      <p className="mb-4 text-sm text-gray-600">{message}</p>
      {children}
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  )
}
