import { useEffect, useRef } from 'react'
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
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  const label =
    operation === 'load' ? 'Loading workbook' : 'Saving workbook'
  const actionLabel = sheetName
    ? `${operation === 'load' ? 'Loaded' : 'Saving'} ${sheetName}…`
    : label

  return (
    <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-800 dark:text-gray-200">
        <span>{actionLabel}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
      const id = toast.error(message, {
        label: 'Retry',
        onClick: () => {
          // Retry is handled by the caller via the error toast action
        },
      })
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
  }, [operation, phase, current, total, sheetName, message])

  return null
}
