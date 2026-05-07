import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

interface DetailPageLayoutProps {
  /** Back navigation link */
  backTo: string
  backLabel: string
  
  /** Page content */
  children: ReactNode
  
  /** Optional loading state */
  loading?: boolean
  loadingSpinner?: ReactNode
  
  /** Optional not found state */
  notFound?: boolean
  notFoundMessage?: string
  notFoundBackTo?: string
  notFoundBackLabel?: string
}

export function DetailPageLayout({
  backTo,
  backLabel,
  children,
  loading = false,
  loadingSpinner,
  notFound = false,
  notFoundMessage,
  notFoundBackTo,
  notFoundBackLabel,
}: DetailPageLayoutProps) {
  if (notFound) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="px-8 py-12 text-center">
          <p className="text-text-muted">{notFoundMessage || 'Not found'}</p>
          {notFoundBackTo && (
            <Link
              to={notFoundBackTo}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              ← {notFoundBackLabel || 'Back'}
            </Link>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {loading ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          {loadingSpinner}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Link
              to={backTo}
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              ← {backLabel}
            </Link>
          </div>
          {children}
        </>
      )}
    </div>
  )
}

interface DetailPageHeaderProps {
  /** Title shown in first widget */
  title: string
  subtitle?: ReactNode
  /** Additional widgets to show in the header grid */
  widgets?: ReactNode
  /** Actions shown at the top right */
  actions?: ReactNode
}

export function DetailPageHeader({
  title,
  subtitle,
  widgets,
  actions,
}: DetailPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">{title}</h2>
          {subtitle && <div className="mt-1 text-text-muted">{subtitle}</div>}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
      {widgets}
    </div>
  )
}

interface DetailPageWidgetGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function DetailPageWidgetGrid({ children, columns = 4 }: DetailPageWidgetGridProps) {
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

interface DetailPageSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export function DetailPageSection({
  title,
  children,
  className = '',
}: DetailPageSectionProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-text">{title}</h3>
      )}
      {children}
    </section>
  )
}

interface DetailPageActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
  hideEdit?: boolean
  hideDelete?: boolean
}

export function DetailPageActions({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  hideEdit = false,
  hideDelete = false,
}: DetailPageActionsProps) {
  return (
    <>
      {!hideEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface"
        >
          {editLabel}
        </button>
      )}
      {!hideDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 dark:border-red-800 bg-surface-elevated px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-950"
        >
          {deleteLabel}
        </button>
      )}
    </>
  )
}

interface DetailPageStatsProps {
  children: ReactNode
  className?: string
}

export function DetailPageStats({ children, className = '' }: DetailPageStatsProps) {
  return (
    <div className={`mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {children}
    </div>
  )
}
