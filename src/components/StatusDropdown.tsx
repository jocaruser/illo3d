import { useTranslation } from 'react-i18next'
import type { JobStatus } from '@/types/money'

const STATUSES: JobStatus[] = [
  'draft',
  'in_progress',
  'delivered',
  'paid',
  'cancelled',
]

interface StatusDropdownProps {
  jobId: string
  status: JobStatus
  onChange: (next: JobStatus) => void
  disabled?: boolean
}

export function StatusDropdown({
  jobId,
  status,
  onChange,
  disabled = false,
}: StatusDropdownProps) {
  const { t } = useTranslation()

  return (
    <select
      id={`job-status-${jobId}`}
      aria-label={t('jobs.statusFieldAria', { id: jobId })}
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`jobs.status.${s}`)}
        </option>
      ))}
    </select>
  )
}
