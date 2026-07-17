import type { InputHTMLAttributes } from 'react'
import { cx } from '@/Component/cx'
import { formControlClasses } from './controlClasses'

type FormInputProps = InputHTMLAttributes<HTMLInputElement>

export function FormInput({ className, ...props }: FormInputProps) {
  return <input {...props} className={cx(formControlClasses, className)} />
}
