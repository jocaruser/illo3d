import type { LabelHTMLAttributes } from 'react'
import { cx } from '@/Component/cx'

type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  return (
    <label {...props} className={cx('block text-sm font-medium text-text', className)}>
      {children}
    </label>
  )
}
