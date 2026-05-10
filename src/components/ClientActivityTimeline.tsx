import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, ClientNoteSeverity, Job, Piece } from '@/types/money'
import type { ClientActivityEntry } from '@/utils/buildClientActivityTimeline'
import { MentionLinkify } from '@/components/MentionLinkify'
import { formatCurrency } from '@/utils/money'

function timelineNoteSurfaceClass(severity: ClientNoteSeverity): string {
  switch (severity) {
    case 'danger':
      return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200'
    case 'warning':
      return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-200'
    case 'success':
      return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-200'
    case 'primary':
      return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200'
    case 'secondary':
      return 'border-border bg-surface text-text'
    default:
      return 'border-border bg-surface-elevated text-text'
  }
}

function formatWhen(isoOrDate: string): string {
  const ms = Date.parse(
    /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())
      ? `${isoOrDate.trim()}T00:00:00.000Z`
      : isoOrDate,
  )
  if (Number.isNaN(ms)) return isoOrDate
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export interface ClientActivityTimelineProps {
  entries: ClientActivityEntry[]
  clients: Client[]
  jobs: Job[]
  pieces: Piece[]
}

export function ClientActivityTimeline({
  entries,
  clients,
  jobs,
  pieces,
}: ClientActivityTimelineProps) {
  const { t } = useTranslation()

  return (
    <section
      className="mb-8"
      data-testid="client-activity-timeline"
      aria-labelledby="client-activity-heading"
    >
      <h2
        id="client-activity-heading"
        className="mb-3 text-xl font-semibold text-text"
      >
        {t('clientDetail.activity.title')}
      </h2>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-text-muted">
          {t('clientDetail.activity.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated shadow">
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-testid={`client-activity-row-${entry.kind}-${entry.tieId}`}
              className="px-4 py-3"
            >
              <ActivityRowBody
                entry={entry}
                clients={clients}
                jobs={jobs}
                pieces={pieces}
                formatWhen={formatWhen}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ActivityRowBody({
  entry,
  clients,
  jobs,
  pieces,
  formatWhen,
}: Omit<ClientActivityTimelineProps, 'entries'> & {
  entry: ClientActivityEntry
  formatWhen: (s: string) => string
}) {
  const { t } = useTranslation()

  const kindLabel = t(`clientDetail.activity.kind.${entry.kind}`)

  switch (entry.kind) {
    case 'client_note':
      return (
        <div
          className={`rounded-md border px-3 py-2 ${timelineNoteSurfaceClass(entry.severity)}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <div className="mt-1 text-sm">
            <MentionLinkify
              text={entry.bodyPreview}
              clients={clients}
              jobs={jobs}
              pieces={pieces}
            />
          </div>
        </div>
      )
    case 'job_note':
      return (
        <div
          className={`rounded-md border px-3 py-2 ${timelineNoteSurfaceClass(entry.severity)}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            <Link
              to={`/jobs/${entry.jobId}`}
              className="font-medium text-primary hover:text-blue-800 dark:text-blue-200"
            >
              {t('clientDetail.activity.jobLink', {
                description: entry.jobDescription,
              })}
            </Link>
          </p>
          <div className="mt-1 text-sm">
            <MentionLinkify
              text={entry.bodyPreview}
              clients={clients}
              jobs={jobs}
              pieces={pieces}
            />
          </div>
        </div>
      )
    case 'job_created':
      return (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm font-medium text-text">
            <Link
              to={`/jobs/${entry.jobId}`}
              className="text-primary hover:text-blue-800 dark:text-blue-200"
              data-testid={`client-activity-job-link-${entry.jobId}`}
            >
              {entry.jobDescription}
            </Link>
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {entry.completed
              ? t('jobs.completed')
              : t('jobs.active')}
          </p>
        </div>
      )
    case 'income': {
      const amountLabel = formatCurrency(entry.amount)
      const concept =
        entry.concept.trim() ||
        t('clientDetail.activity.incomeConceptFallback')
      const line = `${concept} · ${amountLabel}`
      return (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm font-medium">
            {entry.href ? (
              <Link
                to={entry.href}
                data-testid={entry.linkTestId ?? undefined}
                className="text-primary hover:text-blue-800 dark:text-blue-200"
              >
                {line}
              </Link>
            ) : (
              <span className="text-text">{line}</span>
            )}
          </p>
        </div>
      )
    }
    case 'tag':
      return (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm text-text">{entry.tagName}</p>
        </div>
      )
    default: {
      const _exhaustive: never = entry
      void _exhaustive
      return null
    }
  }
}
