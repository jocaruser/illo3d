import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/money'

export interface RecentListItem {
  /** Stable row id (e.g. transaction id). */
  id: string
  date: string
  label: string
  amount: number
  labelLink?: { to: string; testId: string }
}

interface RecentListProps {
  items: RecentListItem[]
  title: string
  viewAllTo: string
}

export function RecentList({ items, title, viewAllTo }: RecentListProps) {
  const { t } = useTranslation()

  const rows = useMemo(() => {
    return [...items]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 5)
  }, [items])

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <Link
          to={viewAllTo}
          className="text-sm font-medium text-primary hover:text-blue-800 dark:text-blue-200"
        >
          {t('dashboard.viewAll')}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted/60">{t('dashboard.recentEmpty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
            >
              <span className="text-text-muted/60">{row.date}</span>
              <span className="min-w-0 flex-1 truncate text-text">
                {row.labelLink ? (
                  <Link
                    to={row.labelLink.to}
                    data-testid={row.labelLink.testId}
                    className="text-primary hover:text-blue-800 dark:text-blue-200"
                  >
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
              </span>
              <span className="font-medium tabular-nums text-text">
                {formatCurrency(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
