import { useEffect } from 'react'
import { useWorkbookStore } from '@/Store/workbookStore'

/**
 * Warns before leaving the tab while the snapshot holds unsaved edits. The
 * browser shows its own generic wording; `preventDefault` plus a non-empty
 * `returnValue` is what actually arms the prompt across engines.
 */
export function useDirtyGuard(): void {
  const dirty = useWorkbookStore((state) => state.dirty)

  useEffect(() => {
    if (!dirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])
}
