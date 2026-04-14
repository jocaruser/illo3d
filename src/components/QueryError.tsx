import { useTranslation } from 'react-i18next'

type QueryErrorProps = {
  messageKey?: string
  onRetry: () => void
}

export function QueryError({
  messageKey = 'errors.fetchFailed',
  onRetry,
}: QueryErrorProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-red-200 bg-white px-8 py-12 text-center shadow">
      <p className="mb-4 text-sm font-medium text-red-800">
        {t(messageKey)}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {t('errors.retryAction')}
      </button>
    </div>
  )
}
