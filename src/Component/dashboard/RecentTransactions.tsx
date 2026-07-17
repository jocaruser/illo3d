import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle } from '@/Component/Card'
import { ColoredNumber } from '@/Component/ColoredNumber'
import type { Transaction } from '@/Entity/Transaction'
import { useEntityManager } from '@/Hook/useEntityManager'
import { formatCurrency } from '@/Service/Pricing/money'

const RECENT_LIMIT = 5

/** Newest first; the id breaks same-day ties so the list never jitters. */
function compareByDateDesc(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return b.id.localeCompare(a.id)
}

/** The five most recent movements, each linked to whatever explains it. */
export function RecentTransactions() {
  const { t } = useTranslation()
  const em = useEntityManager()

  const transactions = em.transactions.findActive().sort(compareByDateDesc).slice(0, RECENT_LIMIT)

  const conceptOf = (transaction: Transaction): ReactNode => {
    if (transaction.refType === 'job') {
      return (
        <Link
          to={`/jobs/${transaction.refId}`}
          className="text-primary hover:underline"
          data-testid={`transaction-concept-job-link-${transaction.id}`}
        >
          {transaction.concept}
        </Link>
      )
    }
    if (transaction.isExpense() && em.lots.findActiveByTransaction(transaction.id).length > 0) {
      return (
        <Link
          to={`/transactions/${transaction.id}`}
          className="text-primary hover:underline"
          data-testid={`transaction-concept-expense-link-${transaction.id}`}
        >
          {transaction.concept}
        </Link>
      )
    }
    return (
      <span className="text-text" data-testid={`transaction-concept-plain-${transaction.id}`}>
        {transaction.concept}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
        <Link to="/transactions" className="text-sm text-primary hover:underline">
          {t('dashboard.viewAll')}
        </Link>
      </CardHeader>
      <CardBody>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-muted">{t('dashboard.recentEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate text-sm">{conceptOf(transaction)}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="text-text-muted">{transaction.date}</span>
                  <ColoredNumber value={transaction.amount ?? 0}>
                    {formatCurrency(transaction.amount ?? 0)}
                  </ColoredNumber>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
