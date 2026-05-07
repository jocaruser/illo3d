import { useTranslation } from 'react-i18next'
import { Card, CardBody } from './Card'

type EmptyStateProps = {
  /** i18n key for empty copy (default matches previous transactions-only behavior). */
  messageKey?: string
}

export function EmptyState({ messageKey = 'transactions.empty' }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardBody className="px-8 py-12 text-center">
        <p className="text-text-muted">{t(messageKey)}</p>
      </CardBody>
    </Card>
  )
}
