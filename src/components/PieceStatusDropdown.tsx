import { useTranslation } from 'react-i18next'
import type { PieceStatus } from '@/types/money'

const STATUSES: PieceStatus[] = ['pending', 'done', 'failed']

interface PieceStatusDropdownProps {
  pieceId: string
  status: PieceStatus
  onChange: (next: PieceStatus) => void
  disabled?: boolean
}

export function PieceStatusDropdown({
  pieceId,
  status,
  onChange,
  disabled = false,
}: PieceStatusDropdownProps) {
  const { t } = useTranslation()

  return (
    <select
      id={`piece-status-${pieceId}`}
      data-testid={`piece-status-${pieceId}`}
      aria-label={t('pieces.statusFieldAria', { id: pieceId })}
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PieceStatus)}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`pieces.status.${s}`)}
        </option>
      ))}
    </select>
  )
}
