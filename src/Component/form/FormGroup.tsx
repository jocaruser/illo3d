import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

interface FormGroupProps {
  children: ReactNode
  className?: string
}

export function FormGroup({ children, className }: FormGroupProps) {
  return <div className={cx('space-y-1', className)}>{children}</div>
}
