import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/money'

interface BalanceDisplayProps {
  balance: number
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-4 py-1 shadow">
      <span className="text-sm font-medium text-text-muted">
        {t('transactions.balance')}:{' '}
      </span>
      <span
        className={`text-lg font-semibold ${
          balance >= 0 ? 'text-success' : 'text-danger'
        }`}
      >
        {formatCurrency(balance)}
      </span>
    </div>
  )
}
