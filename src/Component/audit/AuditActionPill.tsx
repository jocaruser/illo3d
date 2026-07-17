import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import { AUDIT_ACTIONS, type AuditAction } from '@/Entity/AuditEntry'

interface AuditActionPillProps {
  action: AuditAction | ''
}

/**
 * Tone per action: green for rows that (re)appear, blue for edits, red for rows
 * that go away, neutral for the migration baseline — it is bookkeeping, not a
 * user's act, so it must not compete with real changes for attention.
 */
const actionClasses: Record<AuditAction, string> = {
  create: 'bg-success/15 text-success',
  restore: 'bg-success/15 text-success',
  update: 'bg-primary/15 text-primary',
  archive: 'bg-danger/15 text-danger',
  delete: 'bg-danger/15 text-danger',
  migration: 'bg-surface-alt text-text-muted',
}

const unknownClasses = 'bg-surface-alt text-text-muted'

function isKnownAction(action: string): action is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(action)
}

/** The audit log is immutable, so an unreadable action is shown, never hidden. */
export function AuditActionPill({ action }: AuditActionPillProps) {
  const { t } = useTranslation()
  const known = isKnownAction(action)
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        known ? actionClasses[action] : unknownClasses
      )}
    >
      {known ? t(`auditLog.action.${action}`) : t('auditLog.actionUnknown')}
    </span>
  )
}
