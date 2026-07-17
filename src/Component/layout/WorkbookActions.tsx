import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { useWorkbookService } from '@/Hook/useWorkbookService'

interface WorkbookActionsProps {
  /**
   * The header renders these actions twice — inline on desktop, in their own row
   * on mobile — and CSS hides one. Both are in the DOM, so each instance needs
   * its own test id namespace to stay individually addressable.
   */
  testIdPrefix?: string
}

/**
 * Refresh and Save for the workbook snapshot. Refresh discards local edits, so
 * a dirty workbook forces a confirmation first; Save is offered only when
 * there is something to save.
 */
export function WorkbookActions({ testIdPrefix = 'workbook' }: WorkbookActionsProps = {}) {
  const { t } = useTranslation()
  const {
    refresh,
    confirmRefresh,
    cancelRefresh,
    needsConfirm,
    save,
    dirty,
    ready,
  } = useWorkbookService()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-secondary py-1.5 text-sm"
        data-testid={`${testIdPrefix}-refresh`}
        onClick={() => {
          void refresh()
        }}
      >
        {t('workbook.refresh')}
      </button>
      <button
        type="button"
        className="btn-primary py-1.5 text-sm"
        data-testid={`${testIdPrefix}-save`}
        disabled={!ready || !dirty}
        onClick={() => {
          void save()
        }}
      >
        {t('workbook.save')}
      </button>
      <ConfirmDialog
        open={needsConfirm}
        title={t('workbook.discardTitle')}
        message={t('workbook.discardMessage')}
        confirmLabel={t('workbook.discardConfirm')}
        cancelLabel={t('workbook.cancel')}
        onConfirm={() => {
          void confirmRefresh()
        }}
        onCancel={cancelRefresh}
      />
    </div>
  )
}
