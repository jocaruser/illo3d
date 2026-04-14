import { useTranslation } from 'react-i18next'

export function RouteErrorBoundaryFallback({
  onRetry,
}: {
  onRetry: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-lg border border-red-200 bg-white px-6 py-10 shadow">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          {t('errors.routeTitle')}
        </h2>
        <p className="mb-6 text-sm text-gray-600">{t('errors.routeDescription')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('errors.retry')}
        </button>
      </div>
    </div>
  )
}
