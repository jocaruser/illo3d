import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { DetailWidget } from '@/Component/detail/DetailWidget'
import type { ClientMetrics } from '@/Service/Pricing/clientMetrics'
import { formatCurrency } from '@/Service/Pricing/money'

function moneyToneClass(amount: number): string {
  return amount < 0 ? 'text-danger' : 'text-success'
}

interface ClientMetricsWidgetGridProps {
  metrics: ClientMetrics
}

export function ClientMetricsWidgetGrid({ metrics }: ClientMetricsWidgetGridProps) {
  const { t } = useTranslation()

  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      data-testid="client-metrics"
    >
      <DetailWidget label={t('clientDetail.metricPaidLedger')}>
        <span className={cx('tabular-nums', moneyToneClass(metrics.paidLedger))}>
          {formatCurrency(metrics.paidLedger)}
        </span>
      </DetailWidget>
      <DetailWidget label={t('clientDetail.metricOutstanding')}>
        <span className={cx('tabular-nums', moneyToneClass(metrics.outstandingJobs))}>
          {formatCurrency(metrics.outstandingJobs)}
        </span>
      </DetailWidget>
      <DetailWidget label={t('clientDetail.metricJobCount')}>
        <span className="tabular-nums">{String(metrics.jobCount)}</span>
      </DetailWidget>
      <DetailWidget label={t('clientDetail.metricAvgJobPrice')}>
        {metrics.averageJobPrice === null ? (
          <span>—</span>
        ) : (
          <span className={cx('tabular-nums', moneyToneClass(metrics.averageJobPrice))}>
            {formatCurrency(metrics.averageJobPrice)}
          </span>
        )}
      </DetailWidget>
      <DetailWidget label={t('clientDetail.metricMaterials')}>
        <span className={cx('tabular-nums', moneyToneClass(metrics.materialsEstimate))}>
          {formatCurrency(metrics.materialsEstimate)}
        </span>
      </DetailWidget>
    </div>
  )
}
