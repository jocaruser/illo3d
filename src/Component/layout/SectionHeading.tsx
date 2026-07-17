import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

interface SectionHeadingProps {
  children: ReactNode
  className?: string
  /** Lets a landmark point at this heading via `aria-labelledby`. */
  id?: string
}

export function SectionHeading({ children, className, id }: SectionHeadingProps) {
  return (
    <h2 id={id} className={cx('font-display text-lg font-semibold text-text', className)}>
      {children}
    </h2>
  )
}
