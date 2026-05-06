import { useTranslation } from 'react-i18next'

interface CreateConfirmModalProps {
  folderDisplayName: string
  onConfirm: () => void
  onCancel: () => void
}

export function CreateConfirmModal({
  folderDisplayName,
  onConfirm,
  onCancel,
}: CreateConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-confirm-title"
        className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl"
      >
        <h3 id="create-confirm-title" className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('wizard.createConfirmTitle')}
        </h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {t('wizard.createConfirmMessage', { name: folderDisplayName })}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('wizard.createConfirmCancel')}
          </button>
          <button
            type="button"
            data-testid="wizard-create-confirm-action"
            onClick={onConfirm}
            className="btn-primary"
          >
            {t('wizard.createConfirmAction')}
          </button>
        </div>
      </div>
    </div>
  )
}
