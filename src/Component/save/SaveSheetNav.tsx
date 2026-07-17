import { useTranslation } from 'react-i18next'
import { FALLBACK_SHEET_ICON, SHEET_ICON, SHEET_LABEL_KEY } from '@/Component/SheetMeta'
import { StepCard } from '@/Component/StepCard'
import { cx } from '@/Component/cx'
import type { SheetName } from '@/Config/schema'
import { SAVE_STATUS_STYLE, type SaveSheetStatus } from './saveSheetStatus'

export interface SaveSheetNavItem {
  sheet: SheetName
  status: SaveSheetStatus
  /** e.g. "3 rows changed" — omitted for clean sheets. */
  detail?: string
}

interface SaveSheetNavProps {
  items: SaveSheetNavItem[]
  selected: SheetName
  onSelect(sheet: SheetName): void
}

/**
 * The save preview's sheet list: the migration wizard's step cards, made
 * selectable. A sidebar on desktop, a horizontal card strip on narrow screens.
 */
export function SaveSheetNav({ items, selected, onSelect }: SaveSheetNavProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('savePreview.sheetsNav')}>
      <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
        {items.map(({ sheet, status, detail }) => (
          <li key={sheet} className="w-44 shrink-0 md:w-auto">
            <button
              type="button"
              data-testid={`save-nav-${sheet}`}
              aria-current={selected === sheet ? 'true' : undefined}
              aria-label={t('savePreview.sheetStatus', {
                label: t(SHEET_LABEL_KEY[sheet]),
                status: t(`savePreview.status.${status}`),
              })}
              className={cx(
                'block w-full rounded-md text-left',
                selected === sheet && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
              )}
              onClick={() => {
                onSelect(sheet)
              }}
            >
              <StepCard
                label={t(SHEET_LABEL_KEY[sheet])}
                status={status}
                statusConfig={SAVE_STATUS_STYLE}
                detail={detail}
                icon={SHEET_ICON[sheet] ?? FALLBACK_SHEET_ICON}
                pulse={status === 'saving'}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
