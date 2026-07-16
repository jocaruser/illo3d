import { useTranslation } from 'react-i18next'
import { StatCard, type StatTone } from '@/Component/StatCard'
import { useEntityManager } from '@/Hook/useEntityManager'
import {
  activeJobsCount,
  piecesDoneThisWeek,
  revenueThisMonth,
} from '@/Service/Pricing/dashboardStats'
import { calculateBalance, formatCurrency } from '@/Service/Pricing/money'

function balanceTone(balance: number): StatTone {
  if (balance > 0) return 'positive'
  if (balance < 0) return 'negative'
  return 'neutral'
}

/** The four headline numbers of the shop. */
export function StatCards() {
  const { t } = useTranslation()
  const em = useEntityManager()

  const transactions = em.transactions.findAll()
  const balance = calculateBalance(transactions)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t('dashboard.balance')}
        value={formatCurrency(balance)}
        tone={balanceTone(balance)}
        to="/transactions"
      />
      <StatCard
        label={t('dashboard.activeJobs')}
        value={String(activeJobsCount(em.jobs.findAll()))}
      />
      <StatCard
        label={t('dashboard.revenueThisMonth')}
        value={formatCurrency(revenueThisMonth(transactions, em.clock))}
      />
      <StatCard
        label={t('dashboard.piecesThisWeek')}
        value={String(piecesDoneThisWeek(em.pieces.findAll(), em.clock))}
      />
    </div>
  )
}
