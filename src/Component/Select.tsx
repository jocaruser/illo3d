import type { SelectHTMLAttributes } from 'react'
import { cx } from '@/Component/cx'
import { formControlClasses } from '@/Component/form/controlClasses'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
}

/** Native select wrapper for short option lists (roughly eight or fewer). */
export function Select({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <select {...props} className={cx(formControlClasses, className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
