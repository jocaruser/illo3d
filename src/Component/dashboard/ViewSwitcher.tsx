import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'

export type DashboardView = 'kanban' | 'calendar'

const VIEWS: DashboardView[] = ['kanban', 'calendar']

const VIEW_LABEL_KEYS: Record<DashboardView, string> = {
  kanban: 'kanban.viewLabel',
  calendar: 'calendar.viewLabel',
}

interface ViewSwitcherProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
}

/** Kanban ⇄ Calendar: the same jobs, arranged by state or by deadline. */
export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  const { t } = useTranslation()

  return (
    <div
      role="tablist"
      aria-label={t('dashboard.viewSwitcher.label')}
      className="inline-flex rounded-md border border-border bg-surface-alt p-0.5"
    >
      {VIEWS.map((candidate) => (
        <button
          key={candidate}
          type="button"
          role="tab"
          aria-selected={view === candidate}
          onClick={() => onChange(candidate)}
          className={cx(
            'rounded px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            view === candidate
              ? 'bg-surface-elevated text-text shadow-sm'
              : 'text-text-muted hover:text-text'
          )}
        >
          {t(VIEW_LABEL_KEYS[candidate])}
        </button>
      ))}
    </div>
  )
}
