export type AlertVariant =
  'info' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary'

export const alertVariantClasses: Record<AlertVariant, string> = {
  info: 'border-accent/40 bg-accent/10 text-accent',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  primary: 'border-primary/40 bg-primary/10 text-primary',
  secondary: 'border-border bg-surface-alt text-text-muted',
}

/** Urgent variants interrupt with `alert`; the rest announce politely. */
export function alertRole(variant: AlertVariant): 'alert' | 'status' {
  return variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
}
