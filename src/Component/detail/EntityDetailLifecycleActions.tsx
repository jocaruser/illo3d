import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'

export interface EntityDetailLifecycleActionsProps {
  mode: 'active' | 'archived'
  onEdit?: () => void
  /** Label for the edit control when `onEdit` is set (varies by entity). */
  editLabel?: string
  onArchive?: () => void
  onUnarchive?: () => void
  onSoftDelete?: () => void
  /** Compact styling for the job widget toolbar. */
  compact?: boolean
}

export function EntityDetailLifecycleActions({
  mode,
  onEdit,
  editLabel,
  onArchive,
  onUnarchive,
  onSoftDelete,
  compact = false,
}: EntityDetailLifecycleActionsProps) {
  const { t } = useTranslation()
  const btn = cx('btn-secondary', compact && 'px-2 py-1 text-xs')

  if (mode === 'archived') {
    return (
      <>
        {onUnarchive !== undefined && (
          <button
            type="button"
            className={btn}
            data-testid="entity-detail-unarchive"
            onClick={onUnarchive}
          >
            {t('lifecycle.unarchive')}
          </button>
        )}
        {onSoftDelete !== undefined && (
          <button
            type="button"
            className={btn}
            data-testid="entity-detail-soft-delete"
            onClick={onSoftDelete}
          >
            {t('lifecycle.softDelete')}
          </button>
        )}
      </>
    )
  }

  return (
    <>
      {onEdit !== undefined && (
        <button
          type="button"
          className={btn}
          data-testid="entity-detail-edit"
          onClick={onEdit}
        >
          {editLabel ?? t('clients.edit')}
        </button>
      )}
      {onArchive !== undefined && (
        <button
          type="button"
          className={btn}
          data-testid="entity-detail-archive"
          onClick={onArchive}
        >
          {t('lifecycle.archive')}
        </button>
      )}
    </>
  )
}
