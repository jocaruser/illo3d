import { useTranslation } from 'react-i18next'
import { Card, CardBody } from '@/Component/Card'
import { ColoredNumber } from '@/Component/ColoredNumber'
import { useEntityManager } from '@/Hook/useEntityManager'
import { expectedBenefit } from '@/Service/Pricing/expectedBenefit'
import { formatCurrency } from '@/Service/Pricing/money'
import { jobBenefit } from './jobBenefit'

/**
 * Expected benefit across open jobs. Nothing qualifying is a normal state for
 * a young shop, so it reads as guidance rather than an alarming €0.00.
 */
export function ExpectedBenefitCard() {
  const { t } = useTranslation()
  const em = useEntityManager()

  const jobs = em.jobs.findAll()
  const pieces = em.pieces.findAll()
  const pieceItems = em.pieceItems.findAll()
  const inventory = em.inventory.findAll()
  const lots = em.lots.findAll()

  const qualifying = jobs.filter(
    (job) => jobBenefit(job, pieces, pieceItems, inventory, lots) !== null
  )
  const total = expectedBenefit(jobs, pieces, pieceItems, inventory, lots)

  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {t('dashboard.expectedBenefit')}
        </p>
        {qualifying.length === 0 ? (
          <p className="mt-1 text-sm text-text-muted">{t('dashboard.expectedBenefitEmpty')}</p>
        ) : (
          <p className="mt-1 font-display text-2xl font-semibold">
            <ColoredNumber value={total}>{formatCurrency(total)}</ColoredNumber>
          </p>
        )}
      </CardBody>
    </Card>
  )
}
