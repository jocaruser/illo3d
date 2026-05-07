import type { ReactNode } from 'react'

export interface DetailWidgetProps {
  label: string
  value: ReactNode
  bgClass?: string
  textClass?: string
  colSpan?: 1 | 2 | 3 | 4
  alignRight?: boolean
  testId?: string
}

export function DetailWidget({
  label,
  value,
  bgClass = 'bg-surface-elevated',
  textClass = 'text-text',
  colSpan = 1,
  alignRight = false,
  testId,
}: DetailWidgetProps) {
  const spanClass = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  }[colSpan]
  
  return (
    <div
      data-testid={testId}
      className={`rounded-lg border border-border p-4 shadow-sm ${bgClass} ${spanClass}`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${textClass} ${alignRight ? 'text-right' : ''}`}>
        {value}
      </div>
    </div>
  )
}

interface DetailWidgetGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function DetailWidgetGrid({ children, columns = 4 }: DetailWidgetGridProps) {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns]
  
  return (
    <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
      {children}
    </div>
  )
}

// Re-export with old names for backward compatibility
export { DetailWidget as JobWidget, DetailWidgetGrid as JobWidgetGrid }
