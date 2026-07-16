import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'

export type WidgetColSpan = 1 | 2 | 3 | 4

/** Static class strings so Tailwind's content scanner keeps them. */
const colSpanClasses: Record<WidgetColSpan, string> = {
  1: '',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
}

interface DetailWidgetProps {
  label: string
  colSpan?: WidgetColSpan
  testId?: string
  /** Buttons rendered in the widget header (edit / archive / delete). */
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** One cell of a detail widget grid: a muted label above its value. */
export function DetailWidget({
  label,
  colSpan = 1,
  testId,
  actions,
  children,
  className,
}: DetailWidgetProps) {
  return (
    <div
      data-testid={testId}
      className={cx(
        'rounded-lg border border-border bg-surface-elevated p-4 shadow-sm',
        colSpanClasses[colSpan],
        className
      )}
    >
      <div className="flex items-start gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
        {actions !== undefined && (
          <div className="ml-auto flex flex-wrap items-center gap-1">{actions}</div>
        )}
      </div>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  )
}

interface WidgetGridProps {
  children: ReactNode
  className?: string
}

/** Responsive widget grid: one column on phones, two at sm, three from md. */
export function WidgetGrid({ children, className }: WidgetGridProps) {
  return (
    <div className={cx('grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3', className)}>
      {children}
    </div>
  )
}
