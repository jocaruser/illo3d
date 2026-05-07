import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Inventory } from '@/types/money'
import { isActiveRow } from '@/lib/entityFilters'

function alertTierClass(item: Inventory): string | null {
  const q = item.qty_current
  if (item.warn_red > 0 && q <= item.warn_red) {
    return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950'
  }
  if (item.warn_orange > 0 && q <= item.warn_orange) {
    return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950'
  }
  if (item.warn_yellow > 0 && q <= item.warn_yellow) {
    return 'border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950'
  }
  return null
}

interface InventoryAlertsProps {
  items: Inventory[]
}

export function InventoryAlerts({ items }: InventoryAlertsProps) {
  const { t } = useTranslation()

  const alerts = items.filter((item) => {
    if (!isActiveRow(item)) return false
    const q = item.qty_current
    return (
      (item.warn_yellow > 0 && q <= item.warn_yellow) ||
      (item.warn_orange > 0 && q <= item.warn_orange) ||
      (item.warn_red > 0 && q <= item.warn_red)
    )
  })

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-text">
          {t('dashboard.inventory.alerts')}
        </h3>
        <Link
          to="/inventory"
          className="text-sm font-medium text-primary hover:text-blue-800 dark:text-blue-200"
        >
          {t('dashboard.inventory.viewAll')}
        </Link>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-text-muted">{t('dashboard.inventory.healthy')}</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((item) => {
            const tier = alertTierClass(item)
            return (
              <li key={item.id}>
                <Link
                  to={`/inventory/${item.id}`}
                  className={`block rounded-md border border-border px-3 py-2 text-sm hover:opacity-90 ${tier ?? 'bg-surface'}`}
                >
                  <span className="font-medium text-text">{item.name}</span>
                  <span className="ml-2 text-text-muted">{item.qty_current}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
