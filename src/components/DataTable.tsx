import { type ReactNode } from 'react'

interface DataTableProps {
  children: ReactNode
  className?: string
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow ${className}`}>
      <table className="min-w-full divide-y divide-border">
        {children}
      </table>
    </div>
  )
}

interface DataTableHeadProps {
  children: ReactNode
}

export function DataTableHead({ children }: DataTableHeadProps) {
  return (
    <thead className="bg-surface">
      {children}
    </thead>
  )
}

interface DataTableBodyProps {
  children: ReactNode
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return (
    <tbody className="divide-y divide-border bg-surface-elevated">
      {children}
    </tbody>
  )
}

interface DataTableRowProps {
  children: ReactNode
  isEven?: boolean
  className?: string
}

export function DataTableRow({ children, isEven = false, className = '' }: DataTableRowProps) {
  return (
    <tr className={`${isEven ? 'bg-surface-alt' : 'bg-surface-elevated'} hover:bg-surface ${className}`}>
      {children}
    </tr>
  )
}

interface DataTableHeaderCellProps {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function DataTableHeaderCell({ 
  children, 
  align = 'left', 
  className = '' 
}: DataTableHeaderCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]
  
  return (
    <th className={`px-4 py-2 ${alignClass} text-xs font-medium uppercase text-text-muted/60 ${className}`}>
      {children}
    </th>
  )
}

interface DataTableCellProps {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  nowrap?: boolean
}

export function DataTableCell({ 
  children, 
  align = 'left', 
  className = '',
  nowrap = false 
}: DataTableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]
  
  return (
    <td className={`${nowrap ? 'whitespace-nowrap' : ''} px-4 py-3 text-sm text-text ${alignClass} ${className}`}>
      {children}
    </td>
  )
}

interface DataTableEmptyStateProps {
  colSpan: number
  children: ReactNode
}

export function DataTableEmptyState({ colSpan, children }: DataTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-text-muted">
        {children}
      </td>
    </tr>
  )
}
