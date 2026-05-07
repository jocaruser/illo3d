import { type ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary'

interface AlertBoxProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
  title?: string
  'data-testid'?: string
}

const variantStyles: Record<AlertVariant, { container: string; title: string }> = {
  info: {
    container: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200',
    title: 'text-blue-900 dark:text-blue-200',
  },
  primary: {
    container: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200',
    title: 'text-blue-900 dark:text-blue-200',
  },
  success: {
    container: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-200',
    title: 'text-green-900 dark:text-green-200',
  },
  warning: {
    container: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200',
    title: 'text-amber-900 dark:text-amber-200',
  },
  danger: {
    container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200',
    title: 'text-red-900 dark:text-red-200',
  },
  secondary: {
    container: 'border-border bg-surface text-text',
    title: 'text-text',
  },
}

export function AlertBox({ 
  children, 
  variant = 'info', 
  className = '',
  title,
  'data-testid': dataTestId
}: AlertBoxProps) {
  const styles = variantStyles[variant]

  return (
    <div 
      className={`rounded-lg border px-4 py-3 text-sm ${styles.container} ${className}`}
      data-testid={dataTestId}
    >
      {title && (
        <h4 className={`mb-1 font-semibold ${styles.title}`}>
          {title}
        </h4>
      )}
      {children}
    </div>
  )
}

interface AlertStripProps {
  children: ReactNode
  variant?: AlertVariant
  className?: string
}

export function AlertStrip({ 
  children, 
  variant = 'info', 
  className = '' 
}: AlertStripProps) {
  const bgClass = {
    info: 'bg-blue-100 dark:bg-blue-900/30',
    primary: 'bg-blue-100 dark:bg-blue-900/30',
    success: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    secondary: 'bg-gray-100 dark:bg-gray-800/50',
  }[variant]

  const textClass = {
    info: 'text-blue-800 dark:text-blue-200',
    primary: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-amber-800 dark:text-amber-200',
    danger: 'text-red-800 dark:text-red-200',
    secondary: 'text-gray-800 dark:text-gray-200',
  }[variant]

  return (
    <div className={`rounded px-2 py-1 text-xs ${bgClass} ${textClass} ${className}`}>
      {children}
    </div>
  )
}
