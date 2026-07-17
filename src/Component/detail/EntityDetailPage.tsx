import type { ReactNode } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'
import { Card } from '@/Component/Card'

export interface DetailField {
  label: string
  value: ReactNode
}

interface EntityDetailPageProps {
  backTo: string
  backLabel: string
  title: string
  fields: DetailField[]
  /** Edit / Archive / Soft-delete controls, rendered beside the title. */
  actions?: ReactNode
  children?: ReactNode
}

/**
 * Shared shell for entity detail routes: back link, title with an actions slot,
 * a label/value field list, then page-specific sections as `children`.
 */
export function EntityDetailPage({
  backTo,
  backLabel,
  title,
  fields,
  actions,
  children,
}: EntityDetailPageProps) {
  return (
    <div className="space-y-6">
      <Link
        to={backTo}
        data-testid="entity-detail-back"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text hover:underline"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
        {actions !== undefined && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
        )}
      </header>

      <Card className="p-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {field.label}
              </dt>
              <dd className="mt-0.5 break-words text-sm text-text">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {children}
    </div>
  )
}
