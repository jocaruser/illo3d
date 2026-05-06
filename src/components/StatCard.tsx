import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: string
  to?: string
  valueTone?: 'default' | 'positive' | 'negative'
  size?: 'sm' | 'default'
}

export function StatCard({ label, value, to, valueTone = 'default', size = 'default' }: StatCardProps) {
  const valueClass =
    valueTone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : valueTone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-900 dark:text-gray-100'

  const labelClass = size === 'sm'
    ? 'text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500'
    : 'text-sm font-medium text-gray-500 dark:text-gray-500'
  const valueSize = size === 'sm' ? 'mt-1 text-lg font-semibold' : 'mt-1 text-2xl font-semibold'

  const body = (
    <>
      <p className={labelClass}>{label}</p>
      <p className={`${valueSize} ${valueClass}`}>{value}</p>
    </>
  )

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      {to ? (
        <Link to={to} className="block hover:opacity-90">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  )
}
