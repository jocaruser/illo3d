import { type InputHTMLAttributes, forwardRef } from 'react'

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string
  error?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-text
          placeholder:text-text-muted
          focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-danger focus:border-danger focus:ring-danger' 
            : 'border-border'
          }
          ${className}
        `}
        {...props}
      />
    )
  }
)

FormInput.displayName = 'FormInput'

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  className?: string
  error?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-text
          placeholder:text-text-muted
          focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-danger focus:border-danger focus:ring-danger' 
            : 'border-border'
          }
          ${className}
        `}
        {...props}
      />
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  className?: string
  error?: boolean
  children: React.ReactNode
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = '', error = false, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-text
          focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-danger focus:border-danger focus:ring-danger' 
            : 'border-border'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    )
  }
)

FormSelect.displayName = 'FormSelect'

interface FormLabelProps {
  children: React.ReactNode
  htmlFor?: string
  className?: string
  required?: boolean
}

export function FormLabel({ children, htmlFor, className = '', required = false }: FormLabelProps) {
  return (
    <label 
      htmlFor={htmlFor}
      className={`mb-1 block text-sm font-medium text-text ${className}`}
    >
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </label>
  )
}

interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

interface FormErrorProps {
  children: React.ReactNode
  className?: string
}

export function FormError({ children, className = '' }: FormErrorProps) {
  return (
    <p className={`mt-1 text-xs text-danger ${className}`} role="alert">
      {children}
    </p>
  )
}
