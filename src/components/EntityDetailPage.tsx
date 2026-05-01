import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface EntityDetailField {
  label: string
  value: ReactNode
}

interface EntityDetailPageProps {
  backTo: string
  backLabel: string
  title: string
  fields: EntityDetailField[]
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
  /** Extra controls inside the header card, below the field list. */
  belowFields?: ReactNode
  /** When true, the Edit / Delete buttons are not shown. */
  hidePrimaryActions?: boolean
  /** When true with `hidePrimaryActions` false, only the delete (e.g. archive) button is shown. */
  hideEditButton?: boolean
  children?: ReactNode
}

export function EntityDetailPage({
  backTo,
  backLabel,
  title,
  fields,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  belowFields,
  hidePrimaryActions = false,
  hideEditButton = false,
  children,
}: EntityDetailPageProps) {
  return (
    <div>
      <div className="mb-4">
        <Link
          to={backTo}
          data-testid="entity-detail-back"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
        >
          ← {backLabel}
        </Link>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
            {fields.map((f) => (
              <div key={f.label} className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{f.label}:</span>{' '}
                <span className="whitespace-pre-wrap">{f.value}</span>
              </div>
            ))}
            {belowFields ? <div className="mt-4">{belowFields}</div> : null}
          </div>
          {hidePrimaryActions ? null : (
            <div className="flex shrink-0 gap-2">
              {hideEditButton ? null : (
                <button
                  type="button"
                  data-testid="entity-detail-edit"
                  onClick={onEdit}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {editLabel}
                </button>
              )}
              <button
                type="button"
                data-testid="entity-detail-delete"
                onClick={onDelete}
                className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-950"
              >
                {deleteLabel}
              </button>
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}
