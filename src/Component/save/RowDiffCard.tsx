import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUturnLeftIcon } from '@heroicons/react/20/solid'
import { AuditActionPill } from '@/Component/audit/AuditActionPill'
import { AuditEntityLink } from '@/Component/audit/AuditEntityLink'
import type { AuditAction } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import type { FieldDiff, RowDiff, RowDiffAction } from '@/Service/SaveReview/saveDiff'
import { FieldValue } from './FieldValue'

/** The audit vocabulary already names these; reuse its pills and labels. */
const PILL_ACTION: Record<RowDiffAction, AuditAction> = {
  created: 'create',
  modified: 'update',
  deleted: 'delete',
}

interface RowDiffCardProps {
  row: RowDiff
  showUnchanged: boolean
  /** Offered on modified rows only; created/deleted rows have no field to restore. */
  onRevertField?(column: string, before: string): void
}

function sideRecord(fields: FieldDiff[], side: 'before' | 'after'): SheetRecord {
  return Object.fromEntries(fields.map((field) => [field.column, field[side]]))
}

/**
 * One changed row, git-style: the entity as a link, then a − line and a + line
 * per changed field. Unchanged fields stay hidden until asked for, and every
 * changed field of an edited row can be reverted on its own.
 */
export function RowDiffCard({ row, showUnchanged, onRevertField }: RowDiffCardProps) {
  const { t } = useTranslation()
  const beforeRecord = useMemo(() => sideRecord(row.fields, 'before'), [row.fields])
  const afterRecord = useMemo(() => sideRecord(row.fields, 'after'), [row.fields])
  const fields = showUnchanged ? row.fields : row.fields.filter((field) => field.changed)

  return (
    <article
      data-testid={`row-diff-${row.sheet}-${row.entityId}`}
      className="overflow-hidden rounded-lg border border-border bg-surface-elevated"
    >
      <header className="flex items-center gap-2 border-b border-border bg-surface-alt/50 px-3 py-2">
        <AuditActionPill action={PILL_ACTION[row.action]} />
        <div className="min-w-0 flex-1 text-sm font-medium">
          <AuditEntityLink
            entityName={row.entityName}
            entityId={row.entityId}
            beforeJson={row.beforeJson}
            afterJson={row.afterJson}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-text-muted">{row.entityId}</span>
      </header>
      <ul>
        {fields.map((field) => (
          <li key={field.column} className="border-b border-border px-3 py-2 last:border-b-0">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs text-text-muted">{field.column}</span>
              {onRevertField !== undefined && row.action === 'modified' && field.changed && (
                <button
                  type="button"
                  data-testid={`revert-${row.sheet}-${row.entityId}-${field.column}`}
                  aria-label={t('savePreview.revertField', { field: field.column })}
                  title={t('savePreview.revertField', { field: field.column })}
                  className="btn-secondary flex items-center gap-1 px-2 py-0.5 text-xs"
                  onClick={() => {
                    onRevertField(field.column, field.before)
                  }}
                >
                  <ArrowUturnLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('savePreview.revert')}
                </button>
              )}
            </div>
            <div className="mt-1 space-y-0.5 text-sm">
              {field.changed ? (
                <>
                  {row.action !== 'created' && (
                    <div className="flex gap-2 rounded bg-danger/10 px-2 py-0.5 text-danger">
                      <span aria-hidden="true" className="select-none font-mono">
                        −
                      </span>
                      <FieldValue
                        column={field.column}
                        value={field.before}
                        record={beforeRecord}
                      />
                    </div>
                  )}
                  {row.action !== 'deleted' && (
                    <div className="flex gap-2 rounded bg-success/10 px-2 py-0.5 text-success">
                      <span aria-hidden="true" className="select-none font-mono">
                        +
                      </span>
                      <FieldValue
                        column={field.column}
                        value={field.after}
                        record={afterRecord}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-2 px-2 py-0.5 text-text-muted">
                  <span aria-hidden="true" className="select-none font-mono">
                    &nbsp;
                  </span>
                  <FieldValue
                    column={field.column}
                    value={field.after}
                    record={afterRecord}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
