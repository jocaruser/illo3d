import type { ReactNode } from 'react'

export interface JobWidgetProps {
  label: string
  value: ReactNode
  bgClass?: string
  textClass?: string
  colSpan?: 1 | 2
  alignRight?: boolean
  testId?: string
}

export function JobWidget({
  label,
  value,
  bgClass = 'bg-white dark:bg-gray-900',
  textClass = 'text-gray-800 dark:text-gray-200',
  colSpan = 1,
  alignRight = false,
  testId,
}: JobWidgetProps) {
  const spanClass = colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'
  return (
    <div
      data-test-id={testId}
      className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${bgClass} ${spanClass}`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${textClass} ${alignRight ? 'text-right' : ''}`}>
        {value}
      </div>
    </div>
  )
}
