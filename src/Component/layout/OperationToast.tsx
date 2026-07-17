import { useTranslation } from 'react-i18next'
import { useOperationStore } from '@/Store/operationStore'

/**
 * The non-blocking face of a long operation: loads keep the app usable, so
 * their progress lives in a corner card instead of an overlay. Non-blocking
 * saves are excluded — their progress is the save preview's own stepper.
 */
export function OperationToast() {
  const { t } = useTranslation()
  const operation = useOperationStore((state) => state.operation)

  if (operation === null || operation.blocking || operation.kind === 'save') return null

  const { message, sheetName, current, total } = operation
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div
      data-testid="operation-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 w-72 rounded-lg border border-border bg-surface-elevated p-4 shadow-lg"
    >
      <p className="text-sm font-medium text-text">{t(message)}</p>
      {sheetName !== '' && (
        <p className="mt-1 truncate text-xs text-text-muted">{sheetName}</p>
      )}
      <div
        role="progressbar"
        aria-label={t('workbook.progress')}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-text-muted">
        {t('workbook.progressCount', { current, total })}
      </p>
    </div>
  )
}
