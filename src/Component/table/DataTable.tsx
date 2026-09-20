import type { ReactNode } from 'react'
import { cx } from '@/Component/cx'
import {
  tableViewportTierClass,
  type TableViewportTier,
} from '@/Component/table/tableViewportTier'

interface TableSectionProps {
  children?: ReactNode
  className?: string
}

export function DataTable({ children, className }: TableSectionProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className={cx('w-full text-left text-sm text-text', className)}>{children}</table>
    </div>
  )
}

export function TableHead({ children, className }: TableSectionProps) {
  return <thead className={cx('bg-surface-alt', className)}>{children}</thead>
}

export function TableBody({ children, className }: TableSectionProps) {
  return (
    <tbody
      className={cx(
        'divide-y divide-border [&>tr:nth-child(even)]:bg-surface-alt [&>tr:nth-child(odd)]:bg-surface-elevated',
        className
      )}
    >
      {children}
    </tbody>
  )
}

export function TableRow({ children, className }: TableSectionProps) {
  return <tr className={className}>{children}</tr>
}

interface TableHeaderProps extends TableSectionProps {
  viewportTier?: TableViewportTier
}

export function TableHeader({
  children,
  className,
  viewportTier = 'always',
}: TableHeaderProps) {
  return (
    <th
      scope="col"
      className={cx(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted',
        tableViewportTierClass(viewportTier),
        className
      )}
    >
      {children}
    </th>
  )
}

interface TableCellProps {
  children?: ReactNode
  className?: string
  colSpan?: number
  viewportTier?: TableViewportTier
}

export function TableCell({
  children,
  className,
  colSpan,
  viewportTier = 'always',
}: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cx('px-4 py-3', tableViewportTierClass(viewportTier), className)}
    >
      {children}
    </td>
  )
}

interface TableEmptyRowProps {
  colSpan: number
  message: string
}

export function TableEmptyRow({ colSpan, message }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-text-muted">
        {message}
      </td>
    </tr>
  )
}
