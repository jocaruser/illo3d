import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, ClientNoteSeverity, Job, Piece } from '@/types/money'
import type { ClientActivityEntry } from '@/utils/buildClientActivityTimeline'
import { MentionLinkify } from '@/components/MentionLinkify'
import { formatCurrency } from '@/utils/money'

function timelineNoteSurfaceClass(severity: ClientNoteSeverity): string {
  switch (severity) {
    case 'danger':
      return 'border-red-200 bg-red-50 text-red-900'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950'
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'primary':
      return 'border-blue-200 bg-blue-50 text-blue-900'
    case 'secondary':
      return 'border-gray-200 bg-gray-50 text-gray-800'
    default:
      return 'border-gray-200 bg-white text-gray-800'
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
        className="mb-3 text-xl font-semibold text-gray-800"
      >
        {t('clientDetail.activity.title')}
      </h2>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
          {t('clientDetail.activity.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow">
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{kindLabel}</span>
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            <Link
              to={`/jobs/${entry.jobId}`}
              className="font-medium text-blue-600 hover:text-blue-800"
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-900">
            <Link
              to={`/jobs/${entry.jobId}`}
              className="text-blue-600 hover:text-blue-800"
              data-testid={`client-activity-job-link-${entry.jobId}`}
            >
              {entry.jobDescription}
            </Link>
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {t('clientDetail.activity.statusLine', {
              status: t(`jobs.status.${entry.status}`),
            })}
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm font-medium">
            {entry.href ? (
              <Link
                to={entry.href}
                data-testid={entry.linkTestId ?? undefined}
                className="text-blue-600 hover:text-blue-800"
              >
                {line}
              </Link>
            ) : (
              <span className="text-gray-900">{line}</span>
            )}
          </p>
        </div>
      )
    }
    case 'tag':
      return (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-gray-600">
            <span className="font-medium text-gray-800">{kindLabel}</span>
            <time dateTime={entry.sortAt}>{formatWhen(entry.sortAt)}</time>
          </div>
          <p className="mt-1 text-sm text-gray-900">{entry.tagName}</p>
        </div>
      )
    default: {
      const _exhaustive: never = entry
      void _exhaustive
      return null
    }
  }
}
