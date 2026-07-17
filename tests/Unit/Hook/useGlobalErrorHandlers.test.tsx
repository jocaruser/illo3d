import { renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { initI18n } from '@/I18n'
import { useGlobalErrorHandlers } from '@/Hook/useGlobalErrorHandlers'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

// jsdom has no PromiseRejectionEvent constructor; a plain Event with the
// right type is enough because the handler ignores the event payload.
function dispatchUnhandledRejection(): void {
  window.dispatchEvent(new Event('unhandledrejection'))
}

describe('useGlobalErrorHandlers', () => {
  const i18n = initI18n('en')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toasts on an unhandled promise rejection', () => {
    renderHook(() => useGlobalErrorHandlers(i18n))

    dispatchUnhandledRejection()

    expect(toast.error).toHaveBeenCalledWith(
      i18n.t('errors.unexpected'),
      { id: 'global-error' }
    )
  })

  it('toasts on an uncaught window error', () => {
    renderHook(() => useGlobalErrorHandlers(i18n))

    window.dispatchEvent(new Event('error'))

    expect(toast.error).toHaveBeenCalledWith(
      i18n.t('errors.unexpected'),
      { id: 'global-error' }
    )
  })

  it('collapses repeats into one fixed toast id', () => {
    renderHook(() => useGlobalErrorHandlers(i18n))

    dispatchUnhandledRejection()
    dispatchUnhandledRejection()

    expect(toast.error).toHaveBeenCalledTimes(2)
    expect(vi.mocked(toast.error).mock.calls.every(([, opts]) => opts?.id === 'global-error')).toBe(
      true
    )
  })

  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useGlobalErrorHandlers(i18n))

    unmount()
    dispatchUnhandledRejection()
    window.dispatchEvent(new Event('error'))

    expect(toast.error).not.toHaveBeenCalled()
  })
})
