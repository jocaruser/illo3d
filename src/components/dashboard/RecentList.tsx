import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/money'

export interface RecentListItem {
  date: string
  label: string
  amount: number
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
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <Link
          to={viewAllTo}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {t('dashboard.viewAll')}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{t('dashboard.recentEmpty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <li
              key={`${row.date}-${row.label}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
            >
              <span className="text-gray-500">{row.date}</span>
              <span className="min-w-0 flex-1 truncate text-gray-900">
                {row.label}
              </span>
              <span className="font-medium tabular-nums text-gray-800">
                {formatCurrency(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
