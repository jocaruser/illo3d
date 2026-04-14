import { useTranslation } from 'react-i18next'

export function LoadingSpinner() {
  const { t } = useTranslation()
  const label = t('common.loading')

  return (
    <div
      className="flex justify-center py-12"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        aria-hidden
      />
    </div>
  )
}
