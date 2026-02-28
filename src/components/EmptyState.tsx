import { useTranslation } from 'react-i18next'

export function EmptyState() {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
      <p className="text-gray-600">{t('transactions.empty')}</p>
    </div>
  )
}
