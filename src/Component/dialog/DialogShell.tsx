import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DialogShellProps {
  open: boolean
  onClose: () => void
  labelledBy?: string
  children: ReactNode
}

export function DialogShell({ open, onClose, labelledBy, children }: DialogShellProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="dialog-overlay-enter absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="dialog-panel-enter relative w-full max-w-md rounded-lg border border-border bg-surface-elevated p-6 shadow-xl focus:outline-none"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
