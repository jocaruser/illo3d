import type { ReactNode } from 'react'
import type { SortDirection } from '@/lib/listTable/sortDiscovery'

interface SortableColumnHeaderProps {
  columnKey: string
  sortKey: string | null
  sortDir: SortDirection
  onSortChange: (columnKey: string) => void
  className?: string
  thClassName?: string
  /** Right-align header (e.g. numeric columns). */
  alignEnd?: boolean
  children: ReactNode
  ariaLabel: string
}

export function SortableColumnHeader({
  columnKey,
  sortKey,
  sortDir,
  onSortChange,
  className = '',
  thClassName = '',
  alignEnd = false,
  children,
  ariaLabel,
}: SortableColumnHeaderProps) {
  const active = sortKey === columnKey
  const ariaSort = !active ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending'
  const alignTh = alignEnd ? 'text-right' : 'text-left'
  const alignBtn = alignEnd ? 'w-full justify-end text-right' : 'text-left'
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 ${alignTh} ${thClassName}`}
    >
      <button
        type="button"
        className={`inline-flex max-w-full items-center gap-1 rounded px-0.5 py-0.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${alignBtn} ${className}`}
        onClick={() => onSortChange(columnKey)}
        aria-label={ariaLabel}
      >
        <span>{children}</span>
        <span aria-hidden className="shrink-0 text-gray-500">
          {active ? (sortDir === 'asc' ? '\u2191' : '\u2193') : '\u2195'}
        </span>
      </button>
    </th>
  )
}
