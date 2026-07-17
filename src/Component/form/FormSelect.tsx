import type { SelectHTMLAttributes } from 'react'
import { cx } from '@/Component/cx'
import { formControlClasses } from './controlClasses'

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select {...props} className={cx(formControlClasses, className)}>
      {children}
    </select>
  )
}
