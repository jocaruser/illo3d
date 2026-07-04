import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useOperationToastStore } from '@/stores/operationToastStore'
import { toast } from '@/lib/toast'

function ProgressToast({
  operation,
  current,
  total,
  sheetName,
}: {
  operation: string
  current: number
  total: number
  sheetName: string
}) {
  const { t } = useTranslation()
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  const actionLabel = sheetName
    ? operation === 'load'
      ? t('workbook.loadingSheet', { sheet: sheetName })
      : t('workbook.savingSheet', { sheet: sheetName })
    : operation === 'load'
      ? t('workbook.loadingWorkbook')
      : t('workbook.savingWorkbook')

  return (
    <div className="w-80 rounded-lg border border-border bg-surface p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-text">
        <span>{actionLabel}</span>
        <span className="text-text-muted">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function OperationToast() {
  const { blocking, operation, phase, current, total, sheetName, message } =
    useOperationToastStore()

  const toastIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (blocking) return

    if (phase === 'loading' && operation) {
      const id = toast.custom(
        <ProgressToast
          operation={operation}
          current={current}
          total={total}
          sheetName={sheetName}
        />,
        'operation-toast'
      )
      toastIdRef.current = id
      return
    }

    if (phase === 'error' && operation) {
      toast.dismiss('operation-toast')
      const id = toast.error(message)
      toastIdRef.current = id
      return
    }

    if (phase === 'success' && operation) {
      toast.dismiss('operation-toast')
      toast.success(message)
      useOperationToastStore.getState().dismiss()
      return
    }

    if (phase === null) {
      toast.dismiss('operation-toast')
      toastIdRef.current = null
    }
  }, [blocking, operation, phase, current, total, sheetName, message])

  return null
}
