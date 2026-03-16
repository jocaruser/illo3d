import { useTranslation } from 'react-i18next'
import type { Backend } from '@/stores/backendStore'

interface ChooseActionStepProps {
  selectedBackend: Backend | null
  onSelectBackend: (backend: Backend) => void
  onCreateNew: () => void
  onOpenExisting: () => void
  onCancel: () => void
}

export function ChooseActionStep({
  selectedBackend,
  onSelectBackend,
  onCreateNew,
  onOpenExisting,
  onCancel,
}: ChooseActionStepProps) {
  const { t } = useTranslation()

  const storageOptions: { backend: Backend; label: string }[] = [
    { backend: 'local-csv', label: t('wizard.localCsv') },
    { backend: 'google-drive', label: t('wizard.googleDrive') },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('wizard.title')}
      </h3>

      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          {t('wizard.chooseStorage')}
        </p>
        <div className="flex gap-3">
          {storageOptions.map(({ backend, label }) => (
            <button
              key={backend}
              type="button"
              onClick={() => onSelectBackend(backend)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium transition ${
                selectedBackend === backend
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            disabled={!selectedBackend}
            className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-6 font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('wizard.createNew')}
          </button>
          <button
            type="button"
            onClick={onOpenExisting}
            disabled={!selectedBackend}
            className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-6 font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('wizard.openExisting')}
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t('wizard.cancel')}
        </button>
      </div>
    </div>
  )
}
