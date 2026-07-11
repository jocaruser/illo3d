import { useId } from 'react'
import type { ReactNode } from 'react'

export interface StepGridColumns {
  default: number
  sm?: number
  md?: number
  lg?: number
}

export interface StepGridProps {
  children?: ReactNode
  columns?: StepGridColumns
  label?: string
}

const DEFAULT_COLUMNS: StepGridColumns = { default: 2, sm: 3, md: 4 }

function isDefaultLayout(cols: StepGridColumns): boolean {
  return (
    cols.default === 2 &&
    (!cols.sm || cols.sm === 3) &&
    (!cols.md || cols.md === 4) &&
    !cols.lg
  )
}

function buildResponsiveStyle(id: string, cols: StepGridColumns): string {
  const rules: string[] = [
    `#${id}{grid-template-columns:repeat(${cols.default},minmax(0,1fr))}`,
  ]
  if (cols.sm) rules.push(`@media(min-width:640px){#${id}{grid-template-columns:repeat(${cols.sm},minmax(0,1fr))}}`)
  if (cols.md) rules.push(`@media(min-width:768px){#${id}{grid-template-columns:repeat(${cols.md},minmax(0,1fr))}}`)
  if (cols.lg) rules.push(`@media(min-width:1024px){#${id}{grid-template-columns:repeat(${cols.lg},minmax(0,1fr))}}`)
  return rules.join('')
}

export function StepGrid({
  children,
  columns,
  label,
}: StepGridProps) {
  const cols = columns ?? DEFAULT_COLUMNS
  const useDefaultClasses = isDefaultLayout(cols)
  const gridId = useId()

  return (
    <div>
      {label && (
        <div className="mb-2 text-xs font-medium text-gray-500">{label}</div>
      )}
      {!useDefaultClasses && <style>{buildResponsiveStyle(gridId, cols)}</style>}
      <div
        id={gridId}
        className={`grid gap-2 ${useDefaultClasses ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
