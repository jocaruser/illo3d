import { useCallback, useRef, useState } from 'react'

export interface UseConfirmDialog {
  open: boolean
  /** Park an action behind a confirmation prompt. */
  ask(action: () => void | Promise<void>): void
  /** Run the parked action and close. */
  confirm(): Promise<void>
  cancel(): void
  /** True while the confirmed action is still running. */
  busy: boolean
}

/**
 * The confirm-then-act pattern behind `ConfirmDialog`: hold the action, run it
 * once the user agrees, and keep the dialog open (and busy) until it settles.
 */
export function useConfirmDialog(): UseConfirmDialog {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const actionRef = useRef<(() => void | Promise<void>) | null>(null)

  const ask = useCallback((action: () => void | Promise<void>) => {
    actionRef.current = action
    setOpen(true)
  }, [])

  const confirm = useCallback(async () => {
    const action = actionRef.current
    setBusy(true)
    try {
      await action?.()
    } finally {
      setBusy(false)
      setOpen(false)
      actionRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    setOpen(false)
    actionRef.current = null
  }, [])

  return { open, ask, confirm, cancel, busy }
}
