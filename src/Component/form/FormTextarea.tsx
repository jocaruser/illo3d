import type { TextareaHTMLAttributes } from 'react'
import { cx } from '@/Component/cx'
import { formControlClasses } from './controlClasses'

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function FormTextarea({ className, ...props }: FormTextareaProps) {
  return <textarea {...props} className={cx(formControlClasses, className)} />
}
