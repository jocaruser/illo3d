import { useTranslation } from 'react-i18next'
import { Card } from '@/Component/Card'
import { trapFocusKeyDown } from '@/Component/dialog/trapFocus'
import { useOperationStore } from '@/Store/operationStore'

/**
 * The modal face of a long operation: saves must not race the user's edits,
 * so a blocking operation gets an opaque, undismissable overlay.
 */
export function BlockingOverlay() {
  const { t } = useTranslation()
  const operation = useOperationStore((state) => state.operation)

  if (operation === null || !operation.blocking) return null

  const { message, sheetName, current, total } = operation
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div
      data-testid="blocking-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label={t(message)}
      onKeyDown={trapFocusKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface p-4"
    >
      <Card className="w-full max-w-sm p-6">
        <p className="font-display text-lg font-semibold text-text">
          {t(message)}
        </p>
        {sheetName !== '' && (
          <p className="mt-1 text-sm text-text-muted">{sheetName}</p>
        )}
        <div
          role="progressbar"
          aria-label={t('workbook.progress')}
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-alt"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-text-muted">
          {t('workbook.progressCount', { current, total })}
        </p>
      </Card>
    </div>
  )
}
