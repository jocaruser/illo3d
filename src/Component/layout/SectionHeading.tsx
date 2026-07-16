import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

interface SectionHeadingProps {
  children: ReactNode
  className?: string
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2 className={cx('font-display text-lg font-semibold text-text', className)}>{children}</h2>
  )
}
