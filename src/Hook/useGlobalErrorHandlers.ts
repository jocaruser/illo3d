import { useEffect } from 'react'
import type { i18n as I18nInstance } from 'i18next'
import { toast } from 'sonner'

/**
 * Surfaces errors nothing awaited: fire-and-forget promise rejections and
 * uncaught throws outside React's render tree. The browser only logs these to
 * the console; the toast tells the user something actually failed. Render
 * crashes are handled by the error boundaries instead. The i18n instance is
 * passed in because the hook runs in `Kernel`, above `I18nextProvider`.
 * A fixed toast id collapses rejection storms into a single toast.
 */
export function useGlobalErrorHandlers(i18n: I18nInstance): void {
  useEffect(() => {
    const show = (): void => {
      toast.error(i18n.t('errors.unexpected'), { id: 'global-error' })
    }
    window.addEventListener('unhandledrejection', show)
    window.addEventListener('error', show)
    return () => {
      window.removeEventListener('unhandledrejection', show)
      window.removeEventListener('error', show)
    }
  }, [i18n])
}
