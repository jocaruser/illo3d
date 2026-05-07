import { useTranslation } from 'react-i18next'
import { AlertBox } from './AlertBox'

export function RouteErrorBoundaryFallback({
  onRetry,
}: {
  onRetry: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <AlertBox variant="danger" title={t('errors.routeTitle')}>
        <p className="mb-6 text-text-muted">{t('errors.routeDescription')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary"
        >
          {t('errors.retry')}
        </button>
      </AlertBox>
    </div>
  )
}
