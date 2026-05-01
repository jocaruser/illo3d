import { toast as sonnerToast } from 'sonner'

type ToastAction = {
  label: string
  onClick: () => void
}

export const toast = {
  success: (message: string) =>
    sonnerToast.success(message, { duration: 3000 }),

  error: (message: string, action?: ToastAction) =>
    sonnerToast.error(message, {
      duration: Infinity,
      action: action
        ? { label: action.label, onClick: action.onClick }
        : undefined,
    }),

  loading: (message: string) =>
    sonnerToast.loading(message, { duration: Infinity }),

  dismiss: (id: string | number) => sonnerToast.dismiss(id),

  custom: (node: React.ReactNode, id?: string) =>
    sonnerToast.custom(() => node as React.ReactElement, {
      id,
      duration: Infinity,
    }),
}
