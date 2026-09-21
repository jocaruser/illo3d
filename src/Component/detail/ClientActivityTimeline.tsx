import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { RelativeTime } from '@/Component/RelativeTime'
import { useEntityManager } from '@/Hook/useEntityManager'
import {
  activeWorkbookMentionResolvers,
  transactionNavigationTarget,
} from '@/Service/Linking/entityLinkTargets'
import { formatCurrency } from '@/Service/Pricing/money'
import {
  buildClientActivityTimeline,
  type ClientActivityEntry,
} from '@/Service/Pricing/clientActivityTimeline'

interface ClientActivityTimelineProps {
  clientId: string
  /** Bumped by the page after a mutation to recompute the feed. */
  revision?: number
}

/** Merged, newest-first activity feed for a client detail page. */
export function ClientActivityTimeline({
  clientId,
  revision = 0,
}: ClientActivityTimelineProps) {
  const { t } = useTranslation()
  const em = useEntityManager()

  const mentionResolvers = useMemo(
    () => activeWorkbookMentionResolvers(em),
    [em]
  )
  const entries = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return buildClientActivityTimeline(em, clientId)
  }, [em, clientId, revision])

  return (
    <section className="space-y-3" data-testid="client-activity-timeline">
      <SectionHeading>{t('clientDetail.activity.title')}</SectionHeading>
      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t('clientDetail.activity.empty')}
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-testid={`client-activity-row-${entry.id}`}
              className="rounded-lg border border-border bg-surface-elevated p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-muted">
                  {t(`clientDetail.activity.kind.${entry.kind}`)}
                </span>
                {entry.at !== '' && (
                  <span className="text-xs text-text-muted">
                    <RelativeTime value={entry.at} />
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-text">
                <ActivityBody
                  entry={entry}
                  em={em}
                  mentionResolvers={mentionResolvers}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

interface ActivityBodyProps {
  entry: ClientActivityEntry
  em: ReturnType<typeof useEntityManager>
  mentionResolvers: ReturnType<typeof activeWorkbookMentionResolvers>
}

function ActivityBody({ entry, em, mentionResolvers }: ActivityBodyProps) {
  const { t } = useTranslation()

  if (entry.kind === 'income') {
    const to = transactionNavigationTarget(em, entry.transactionId)
    const label =
      entry.concept !== ''
        ? entry.concept
        : t('clientDetail.activity.incomeConceptFallback')
    return (
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="text-success">{formatCurrency(entry.amount)}</span>
        {to?.startsWith('/jobs/') ? (
          <Link
            to={to}
            data-testid={`transaction-concept-job-link-${entry.transactionId}`}
            className="text-primary hover:underline"
          >
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        )}
      </span>
    )
  }

  if (entry.kind === 'tag') {
    return <span>{entry.tagName}</span>
  }

  if (entry.kind === 'client_note') {
    return <MentionLinkify text={entry.body} em={em} {...mentionResolvers} />
  }

  if (entry.kind === 'job_note') {
    return (
      <span className="space-y-1">
        <span className="block">
          <MentionLinkify text={entry.body} em={em} {...mentionResolvers} />
        </span>
        <Link
          to={`/jobs/${entry.jobId}`}
          className="block text-xs text-primary hover:underline"
        >
          {t('clientDetail.activity.jobLink', {
            description: entry.jobDescription,
          })}
        </Link>
      </span>
    )
  }

  return (
    <span className="space-y-1">
      <Link
        to={`/jobs/${entry.jobId}`}
        className="block text-primary hover:underline"
      >
        {t('clientDetail.activity.jobLink', {
          description: entry.jobDescription,
        })}
      </Link>
      <span className="block text-xs text-text-muted">
        {t('clientDetail.activity.statusLine', {
          status: t(`jobs.status.${entry.status}`),
        })}
      </span>
    </span>
  )
}
