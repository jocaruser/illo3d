import { toast as sonnerToast } from 'sonner'

/**
 * The app's only entry point to the toast library. App code imports this
 * wrapper, never `sonner` directly, so the dependency stays swappable and the
 * surface stays as small as the app actually needs.
 */

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  action?: ToastAction
}

export const toast = {
  success(message: string): void {
    sonnerToast.success(message)
  },

  error(message: string, options: ToastOptions = {}): void {
    const { action } = options
    sonnerToast.error(
      message,
      action === undefined
        ? undefined
        : { action: { label: action.label, onClick: () => action.onClick() } }
    )
  },

  dismiss(): void {
    sonnerToast.dismiss()
  },
}
