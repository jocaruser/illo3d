import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

interface CardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-lg border border-border bg-surface-elevated shadow-sm',
        interactive && 'card-hover-lift',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardSectionProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <div className={cx('border-b border-border px-4 py-3', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardSectionProps) {
  return <h3 className={cx('font-display text-lg font-semibold text-text', className)}>{children}</h3>
}

export function CardBody({ children, className }: CardSectionProps) {
  return <div className={cx('p-4', className)}>{children}</div>
}
