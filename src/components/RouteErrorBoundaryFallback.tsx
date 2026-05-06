import { useTranslation } from 'react-i18next'

export function RouteErrorBoundaryFallback({
  onRetry,
}: {
  onRetry: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-lg border border-red-200 bg-white px-6 py-10 shadow dark:border-red-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('errors.routeTitle')}
        </h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{t('errors.routeDescription')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary"
        >
          {t('errors.retry')}
        </button>
      </div>
    </div>
  )
}
