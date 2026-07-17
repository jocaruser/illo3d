import type { ReactNode } from 'react'
import {
  alertRole,
  alertVariantClasses,
  type AlertVariant,
} from '@/Component/alertVariants'
import { cx } from '@/Component/cx'

interface AlertBoxProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

export function AlertBox({
  children,
  variant = 'info',
  className,
}: AlertBoxProps) {
  return (
    <div
      role={alertRole(variant)}
      className={cx(
        'rounded-md border p-4 text-sm',
        alertVariantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
