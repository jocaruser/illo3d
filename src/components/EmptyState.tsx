import { useTranslation } from 'react-i18next'

type EmptyStateProps = {
  /** i18n key for empty copy (default matches previous transactions-only behavior). */
  messageKey?: string
}

export function EmptyState({ messageKey = 'transactions.empty' }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow dark:border-gray-700 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">{t(messageKey)}</p>
    </div>
  )
}
