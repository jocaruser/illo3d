import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Breadcrumbs, type BreadcrumbItem } from '@/Component/Breadcrumbs'

/** First path segment → nav label key. Unknown segments get no crumb. */
const SECTION_LABEL_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  clients: 'nav.clients',
  jobs: 'nav.jobs',
  transactions: 'nav.transactions',
  inventory: 'nav.inventory',
  'audit-log': 'nav.auditLog',
}

/**
 * Route-derived breadcrumbs: Home / Section / Entity id. Detail pages get the
 * raw id — pages that know the entity's name render it in their own heading.
 */
export function BreadcrumbBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const segments = pathname.split('/').filter((segment) => segment !== '')
  const items: BreadcrumbItem[] = [{ label: t('breadcrumb.home'), to: '/' }]
  const labelKey =
    segments.length > 0 ? SECTION_LABEL_KEYS[segments[0]] : undefined

  if (labelKey !== undefined) {
    items.push({
      label: t(labelKey),
      to: segments.length > 1 ? `/${segments[0]}` : undefined,
    })
    if (segments.length > 1)
      items.push({ label: decodeURIComponent(segments[1]) })
  }

  return (
    <div className="border-b border-border bg-surface-elevated">
      <div className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <Breadcrumbs items={items} />
      </div>
    </div>
  )
}
