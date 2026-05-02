import { useTranslation } from 'react-i18next'
import { useOperationToastStore } from '@/stores/operationToastStore'

function ProgressCard({
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
  const labelKey = operation === 'save' ? 'workbook.savingWorkbook' : 'workbook.loadingWorkbook'
  const actionKey = operation === 'save' ? 'workbook.savingSheet' : 'workbook.loadingSheet'

  return (
    <div className="w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
        {t(labelKey)}
      </div>
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {sheetName ? t(actionKey, { sheet: sheetName }) : t(labelKey)}
      </div>
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{t('workbook.progress')}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function BlockingOverlay() {
  const { blocking, phase, operation, current, total, sheetName } =
    useOperationToastStore()

  if (!blocking || phase !== 'loading' || !operation) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <ProgressCard
        operation={operation}
        current={current}
        total={total}
        sheetName={sheetName}
      />
    </div>
  )
}
