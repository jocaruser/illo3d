const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/** The structural slice of a React keyboard event the trap needs. */
export interface TrapFocusKeyEvent {
  key: string
  shiftKey: boolean
  currentTarget: HTMLElement
  preventDefault(): void
}

/**
 * Keeps Tab inside the element it is attached to, wrapping from the last
 * focusable descendant to the first and back. Attach as a modal panel's
 * `onKeyDown` so keyboard users cannot tab out behind the overlay.
 */
export function trapFocusKeyDown(event: TrapFocusKeyEvent): void {
  if (event.key !== 'Tab') return
  const container = event.currentTarget
  const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  if (focusable.length === 0) {
    event.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (event.shiftKey) {
    // The panel itself starts focused, so wrap backwards from it too.
    if (active === first || active === container) {
      event.preventDefault()
      last.focus()
    }
    return
  }
  if (active === last) {
    event.preventDefault()
    first.focus()
  }
}
