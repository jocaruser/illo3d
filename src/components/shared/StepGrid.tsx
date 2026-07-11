import type { ReactNode, CSSProperties } from 'react'

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

function buildInlineStyle(cols: StepGridColumns): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${cols.default}, minmax(0, 1fr))`,
  }
}

export function StepGrid({
  children,
  columns,
  label,
}: StepGridProps) {
  const cols = columns ?? DEFAULT_COLUMNS
  const useDefaultClasses = isDefaultLayout(cols)

  return (
    <div>
      {label && (
        <div className="mb-2 text-xs font-medium text-gray-500">{label}</div>
      )}
      <div
        className={`grid gap-2 ${useDefaultClasses ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : ''}`}
        style={useDefaultClasses ? {} : buildInlineStyle(cols)}
      >
        {children}
      </div>
    </div>
  )
}
