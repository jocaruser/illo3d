import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/utils/money'

interface BalanceDisplayProps {
  balance: number
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow">
      <span className="text-sm font-medium text-gray-600">
        {t('transactions.balance')}:{' '}
      </span>
      <span
        className={`text-lg font-semibold ${
          balance >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {formatCurrency(balance)}
      </span>
    </div>
  )
}
