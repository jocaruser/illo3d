import { useTranslation } from 'react-i18next'
import type { Inventory, Job, Lot, Piece, PieceItem } from '@/types/money'
import {
  dashboardExpectedBenefitHasQualifyingPiece,
  dashboardExpectedBenefitTotal,
} from '@/utils/expectedBenefit'
import { formatCurrency } from '@/utils/money'

export interface ExpectedBenefitCardProps {
  jobs: Job[]
  pieces: Piece[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  lots: Lot[]
}

export function ExpectedBenefitCard({
  jobs,
  pieces,
  pieceItems,
  inventory,
  lots,
}: ExpectedBenefitCardProps) {
  const { t } = useTranslation()
  const has = dashboardExpectedBenefitHasQualifyingPiece(
    jobs,
    pieces,
    pieceItems,
    inventory,
    lots,
  )
  if (!has) {
    return (
      <div
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-400 shadow"
        data-testid="dashboard-expected-benefit-empty"
      >
        <p className="font-medium text-gray-800 dark:text-gray-200">
          {t('dashboard.expectedBenefit')}
        </p>
        <p className="mt-2">{t('dashboard.expectedBenefitEmpty')}</p>
      </div>
    )
  }
  const total = dashboardExpectedBenefitTotal(
    jobs,
    pieces,
    pieceItems,
    inventory,
    lots,
  )
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {t('dashboard.expectedBenefit')}
      </p>
      <p
        className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100"
        data-testid="dashboard-expected-benefit"
      >
        {formatCurrency(total)}
      </p>
    </div>
  )
}
