import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { cx } from '@/Component/cx'

interface NavItem {
  to: string
  labelKey: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard' },
  { to: '/clients', labelKey: 'nav.clients' },
  { to: '/jobs', labelKey: 'nav.jobs' },
  { to: '/transactions', labelKey: 'nav.transactions' },
  { to: '/inventory', labelKey: 'nav.inventory' },
  { to: '/audit-log', labelKey: 'nav.auditLog' },
]

/** A section owns its detail routes: `/jobs/J1` keeps Jobs highlighted. */
function isActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`)
}

interface AppNavProps {
  /** Vertical stack for the mobile sheet instead of the desktop row. */
  orientation?: 'horizontal' | 'vertical'
  onNavigate?: () => void
}

/**
 * Section links, highlighted purely from the current route — never from
 * search, hover or any other transient state.
 */
export function AppNav({
  orientation = 'horizontal',
  onNavigate,
}: AppNavProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav
      aria-label={t('nav.ariaLabel')}
      className={cx(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center'
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.to)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cx(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-surface-alt hover:text-text'
            )}
          >
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
