import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  const { t } = useTranslation()
  return (
    <span role="status" aria-busy="true" className={cx('inline-flex items-center', className)}>
      <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
      <span className="sr-only">{t('common.loading')}</span>
    </span>
  )
}
