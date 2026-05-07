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
      ? 'text-success'
      : valueTone === 'negative'
        ? 'text-danger'
        : 'text-text'

  const labelClass = size === 'sm'
    ? 'text-xs font-medium uppercase tracking-wide text-text-muted/60'
    : 'text-sm font-medium text-text-muted/60'
  const valueSize = size === 'sm' ? 'mt-1 text-lg font-semibold' : 'mt-1 text-2xl font-semibold'

  const body = (
    <>
      <p className={labelClass}>{label}</p>
      <p className={`${valueSize} ${valueClass}`}>{value}</p>
    </>
  )

  const cardClasses = to
    ? 'rounded-lg border border-border bg-surface-elevated p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0'
    : 'rounded-lg border border-border bg-surface-elevated p-4 shadow-sm'

  return (
    <div className={cardClasses}>
      {to ? (
        <Link to={to} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  )
}
