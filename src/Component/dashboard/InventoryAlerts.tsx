import { useTranslation } from 'react-i18next'
import { Card, CardBody, CardHeader, CardTitle } from '@/Component/Card'
import { cx } from '@/Component/cx'
import { Link } from 'react-router-dom'
import type { InventoryItem, StockAlertLevel } from '@/Entity/InventoryItem'
import { useEntityManager } from '@/Hook/useEntityManager'

type AlertLevel = Exclude<StockAlertLevel, null>

interface StockAlert {
  item: InventoryItem
  level: AlertLevel
}

/** Red first: the border is the whole point of the widget. */
const LEVEL_ORDER: Record<AlertLevel, number> = { red: 0, orange: 1, yellow: 2 }

/** There is no yellow token; the mild tier is a lighter warning. */
const LEVEL_BORDER: Record<AlertLevel, string> = {
  red: 'border-l-danger',
  orange: 'border-l-warning',
  yellow: 'border-l-warning/50',
}

/** Inventory at or below its thresholds, worst first. */
export function InventoryAlerts() {
  const { t } = useTranslation()
  const em = useEntityManager()

  const alerts: StockAlert[] = []
  for (const item of em.inventory.findActive()) {
    const level = item.stockAlertLevel()
    if (level === null) continue
    alerts.push({ item, level })
  }
  alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t('dashboard.inventory.alerts')}</CardTitle>
        <Link to="/inventory" className="text-sm text-primary hover:underline">
          {t('dashboard.inventory.viewAll')}
        </Link>
      </CardHeader>
      <CardBody>
        {alerts.length === 0 ? (
          <p className="text-sm text-text-muted">{t('dashboard.inventory.healthy')}</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map(({ item, level }) => (
              <li key={item.id}>
                <Link
                  to={`/inventory/${item.id}`}
                  data-level={level}
                  className={cx(
                    'flex items-center justify-between rounded border-l-4 bg-surface-alt px-3 py-2 text-sm hover:bg-surface-alt/70',
                    LEVEL_BORDER[level]
                  )}
                >
                  <span className="truncate text-text">{item.name}</span>
                  <span className="ml-2 shrink-0 text-text-muted">{item.qtyCurrent}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
