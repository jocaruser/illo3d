import { useTranslation } from 'react-i18next'
import type { SheetsConnectionStatus } from '@/stores/sheetsStore'

interface ConnectionStatusProps {
  status: SheetsConnectionStatus
  errorMessage: string | null
  onRetry?: () => void
}

export function ConnectionStatus({
  status,
  errorMessage,
  onRetry,
}: ConnectionStatusProps) {
  const { t } = useTranslation()

  if (status === 'connected') {
    return null
  }

  if (status === 'idle') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <p className="text-sm text-gray-700">{t('transactions.connectPrompt')}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            {t('transactions.connect')}
          </button>
        )}
      </div>
    )
  }

  if (status === 'connecting') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        {t('transactions.connecting')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-800">
          {t('transactions.error')}: {errorMessage}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800"
          >
            {t('transactions.retry')}
          </button>
        )}
      </div>
    )
  }

  return null
}
