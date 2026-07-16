import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary'

export const alertVariantClasses: Record<AlertVariant, string> = {
  info: 'border-accent/40 bg-accent/10 text-accent',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  primary: 'border-primary/40 bg-primary/10 text-primary',
  secondary: 'border-border bg-surface-alt text-text-muted',
}

export function alertRole(variant: AlertVariant): 'alert' | 'status' {
  return variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
}

interface AlertBoxProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

export function AlertBox({ children, variant = 'info', className }: AlertBoxProps) {
  return (
    <div
      role={alertRole(variant)}
      className={cx('rounded-md border p-4 text-sm', alertVariantClasses[variant], className)}
    >
      {children}
    </div>
  )
}
