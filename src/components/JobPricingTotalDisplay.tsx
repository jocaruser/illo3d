import type { Piece } from '@/types/money'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { formatCurrency } from '@/utils/money'

const incompleteHighlightClassName =
  'inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-semibold text-amber-900'

type JobPricingTotalDisplayProps = {
  jobId: string
  pieces: Piece[]
  t: (key: string) => string
  /** Smaller badge on dense surfaces (e.g. kanban cards). */
  size?: 'default' | 'compact'
}

export function JobPricingTotalDisplay({
  jobId,
  pieces,
  t,
  size = 'default',
}: JobPricingTotalDisplayProps) {
  const s = jobPricingState(jobId, pieces)
  if (s.kind === 'empty') {
    return <span className="text-gray-500">—</span>
  }
  if (s.kind === 'incomplete') {
    const sizeClass = size === 'compact' ? ' text-xs' : ' text-sm'
    return (
      <span
        className={`${incompleteHighlightClassName}${sizeClass}`}
        data-testid={`job-pricing-incomplete-${jobId}`}
      >
        {t('jobs.totalIncomplete')}
      </span>
    )
  }
  return <span>{formatCurrency(s.total)}</span>
}
