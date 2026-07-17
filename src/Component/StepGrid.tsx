import { Children, type ReactNode } from 'react'

interface StepGridProps {
  label?: string
  children?: ReactNode
}

/** Responsive step grid: 2 columns below 640px, 3 to 768px, 4 above. */
export function StepGrid({ label, children }: StepGridProps) {
  if (Children.count(children) === 0) return null
  return (
    <section>
      {label !== undefined && (
        <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{children}</div>
    </section>
  )
}
