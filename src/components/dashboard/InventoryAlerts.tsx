import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Inventory } from '@/types/money'

function qtyTierClass(item: Inventory): string | null {
  if (item.qty_initial <= 1) return null
  const ratio = item.qty_current / item.qty_initial
  if (ratio > 0.5) return null
  if (ratio > 0.3) return 'border-l-4 border-yellow-400 bg-yellow-50'
  if (ratio > 0.1) return 'border-l-4 border-orange-500 bg-orange-50'
  return 'border-l-4 border-red-500 bg-red-50'
}

function isActiveInventory(row: Inventory): boolean {
  return row.archived !== 'true' && row.deleted !== 'true'
}

interface InventoryAlertsProps {
  items: Inventory[]
}

export function InventoryAlerts({ items }: InventoryAlertsProps) {
  const { t } = useTranslation()

  const alerts = items.filter((item) => {
    if (!isActiveInventory(item)) return false
    if (item.qty_initial <= 1) return false
    const ratio = item.qty_current / item.qty_initial
    return ratio <= 0.3
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('dashboard.inventory.alerts')}
        </h3>
        <Link
          to="/inventory"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {t('dashboard.inventory.viewAll')}
        </Link>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-600">{t('dashboard.inventory.healthy')}</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((item) => {
            const tier = qtyTierClass(item)
            return (
              <li key={item.id}>
                <Link
                  to="/inventory"
                  className={`block rounded-md border border-gray-200 px-3 py-2 text-sm hover:opacity-90 ${tier ?? 'bg-gray-50'}`}
                >
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="ml-2 text-gray-600">
                    {item.qty_current} / {item.qty_initial}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
