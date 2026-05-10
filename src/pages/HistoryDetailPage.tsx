import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useHistoryEntry } from '@/hooks/useHistory'
import { EmptyState } from '@/components/EmptyState'

function parseSnapshot(json: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(json) as {
      _entityType?: string
      _timestamp?: string
      _null?: boolean
      _deleted?: boolean
      data?: Record<string, unknown>
    }
    if (parsed._null) return null
    return parsed.data ?? parsed
  } catch {
    return null
  }
}

function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Array<{ key: string; before: string; after: string; changed: boolean }> {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])

  return Array.from(allKeys)
    .filter((k) => !k.startsWith('_'))
    .map((key) => {
      const b = before?.[key]
      const a = after?.[key]
      return {
        key,
        before: b !== undefined ? String(b) : '',
        after: a !== undefined ? String(a) : '',
        changed: JSON.stringify(b) !== JSON.stringify(a),
      }
    })
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function HistoryDetailPage() {
  const { historyId } = useParams<{ historyId: string }>()
  const { t } = useTranslation()
  const { data: entry, isLoading } = useHistoryEntry(historyId)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="p-6">
        <EmptyState messageKey="history.notFound" />
      </div>
    )
  }

  const beforeData = parseSnapshot(entry.raw_data_before ?? '')
  const afterData = parseSnapshot(entry.raw_data_after ?? '')
  const diffs = computeDiff(beforeData, afterData)

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/history"
          className="text-sm text-primary hover:text-blue-800"
        >
          ← {t('history.backToList', 'Back to history')}
        </Link>
      </div>

      <h2 className="mb-6 text-2xl font-semibold text-text">
        {t('history.detailTitle', 'History Entry')}
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">
            {t('history.entityType', 'Entity Type')}
          </div>
          <div className="mt-1 text-sm font-medium text-text">
            {entry.entity_type}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">
            {t('history.entityId', 'Entity ID')}
          </div>
          <div className="mt-1 text-sm font-medium text-text">
            {entry.entity_id}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">
            {t('history.changedAt', 'Changed At')}
          </div>
          <div className="mt-1 text-sm font-medium text-text">
            {new Date(entry.changed_at).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">
            {t('history.changedBy', 'Changed By')}
          </div>
          <div className="mt-1 text-sm font-medium text-text">
            {entry.changed_by}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                {t('history.field', 'Field')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                {t('history.before', 'Before')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                {t('history.after', 'After')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-elevated">
            {diffs.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-text-muted"
                >
                  {t('history.noChanges', 'No changes detected.')}
                </td>
              </tr>
            ) : (
              diffs.map((diff) => (
                <tr
                  key={diff.key}
                  className={`${
                    diff.changed
                      ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : 'odd:bg-surface-elevated even:bg-surface-alt'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text">
                    {diff.key}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {diff.before || (
                      <span className="italic text-text-muted/50">
                        {t('history.empty', '(empty)')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text">
                    {diff.after || (
                      <span className="italic text-text-muted/50">
                        {t('history.empty', '(empty)')}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-medium text-text-muted">
            {t('history.rawBefore', 'Raw Before')}
          </h3>
          <pre className="max-h-64 overflow-auto rounded bg-surface-alt p-3 text-xs text-text">
            {JSON.stringify(beforeData, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-medium text-text-muted">
            {t('history.rawAfter', 'Raw After')}
          </h3>
          <pre className="max-h-64 overflow-auto rounded bg-surface-alt p-3 text-xs text-text">
            {JSON.stringify(afterData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
