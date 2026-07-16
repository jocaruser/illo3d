import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'
import { alertRole, alertVariantClasses, type AlertVariant } from '@/Component/AlertBox'

interface AlertStripProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

export function AlertStrip({ children, variant = 'info', className }: AlertStripProps) {
  return (
    <div
      role={alertRole(variant)}
      className={cx(
        'border-l-4 px-3 py-2 text-sm',
        alertVariantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
