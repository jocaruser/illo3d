import { useTranslation } from 'react-i18next'
import type { WorkbookStatus } from '@/stores/workbookStore'

interface ConnectionStatusProps {
  status: WorkbookStatus
  errorMessage: string | null
  onRetry?: () => void
}

export function ConnectionStatus({
  status,
  errorMessage,
  onRetry,
}: ConnectionStatusProps) {
  const { t } = useTranslation()

  if (status === 'ready') {
    return null
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        {t('errors.connectionConnecting')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {t('errors.connectionError')}: {errorMessage}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            {t('errors.connectionRetry')}
          </button>
        )}
      </div>
    )
  }

  return null
}
