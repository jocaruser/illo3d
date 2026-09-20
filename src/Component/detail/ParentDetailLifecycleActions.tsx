import { useTranslation } from 'react-i18next'

export interface ParentDetailLifecycleActionsProps {
  canEdit?: boolean
  canArchive?: boolean
  canUnarchive?: boolean
  canSoftDelete?: boolean
  onEdit?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onSoftDelete?: () => void
  /** Smaller buttons for the job widget toolbar. */
  compact?: boolean
  /** Edit label for compact job header actions. */
  editLabelKey?: 'jobs.editJob' | 'clients.edit'
}

export function ParentDetailLifecycleActions({
  canEdit = false,
  canArchive = false,
  canUnarchive = false,
  canSoftDelete = false,
  onEdit,
  onArchive,
  onUnarchive,
  onSoftDelete,
  compact = false,
  editLabelKey = 'clients.edit',
}: ParentDetailLifecycleActionsProps) {
  const { t } = useTranslation()
  const buttonClass = compact ? 'btn-secondary px-2 py-1 text-xs' : 'btn-secondary'

  return (
    <>
      {canEdit && onEdit !== undefined && (
        <button
          type="button"
          className={buttonClass}
          data-testid="entity-detail-edit"
          onClick={onEdit}
        >
          {t(editLabelKey)}
        </button>
      )}
      {canArchive && onArchive !== undefined && (
        <button
          type="button"
          className={buttonClass}
          data-testid="entity-detail-archive"
          onClick={onArchive}
        >
          {t('lifecycle.archive')}
        </button>
      )}
      {canUnarchive && onUnarchive !== undefined && (
        <button
          type="button"
          className={buttonClass}
          data-testid="entity-detail-unarchive"
          onClick={onUnarchive}
        >
          {t('lifecycle.unarchive')}
        </button>
      )}
      {canSoftDelete && onSoftDelete !== undefined && (
        <button
          type="button"
          className={buttonClass}
          data-testid="entity-detail-delete"
          onClick={onSoftDelete}
        >
          {t('lifecycle.softDelete')}
        </button>
      )}
    </>
  )
}
