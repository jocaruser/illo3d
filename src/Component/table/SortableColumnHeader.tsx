import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'

export type SortDirection = 'asc' | 'desc' | null

interface SortableColumnHeaderProps {
  label: string
  direction: SortDirection
  onToggle: (next: 'asc' | 'desc') => void
}

export function SortableColumnHeader({ label, direction, onToggle }: SortableColumnHeaderProps) {
  const { t } = useTranslation()
  const ariaSort =
    direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined
  const buttonLabel =
    direction === 'asc'
      ? t('listTable.sortedAscending', { column: label })
      : direction === 'desc'
        ? t('listTable.sortedDescending', { column: label })
        : t('listTable.sortBy', { column: label })
  const Chevron =
    direction === 'asc' ? ChevronUpIcon : direction === 'desc' ? ChevronDownIcon : ChevronUpDownIcon
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted"
    >
      <button
        type="button"
        aria-label={buttonLabel}
        onClick={() => onToggle(direction === 'asc' ? 'desc' : 'asc')}
        className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-text"
      >
        {label}
        <Chevron className="h-4 w-4" aria-hidden="true" />
      </button>
    </th>
  )
}
