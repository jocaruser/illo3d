import { Link } from 'react-router-dom'
import { cx } from '@/Component/cx'

export type StatTone = 'positive' | 'negative' | 'neutral'

interface StatCardProps {
  label: string
  value: string
  tone?: StatTone
  to?: string
}

const toneClasses: Record<StatTone, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-text',
}

export function StatCard({ label, value, tone = 'neutral', to }: StatCardProps) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cx('mt-1 font-display text-2xl font-semibold', toneClasses[tone])}>{value}</p>
    </>
  )
  const base = 'block rounded-lg border border-border bg-surface-elevated p-4 shadow-sm'
  if (to !== undefined) {
    return (
      <Link to={to} className={cx(base, 'card-hover-lift')}>
        {content}
      </Link>
    )
  }
  return <div className={base}>{content}</div>
}
