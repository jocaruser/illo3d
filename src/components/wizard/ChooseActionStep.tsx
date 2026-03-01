import { useTranslation } from 'react-i18next'

interface ChooseActionStepProps {
  onCreateNew: () => void
  onOpenExisting: () => void
  onCancel: () => void
}

export function ChooseActionStep({
  onCreateNew,
  onOpenExisting,
  onCancel,
}: ChooseActionStepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        {t('wizard.title')}
      </h3>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          {t('wizard.createNew')}
        </button>
        <button
          type="button"
          onClick={onOpenExisting}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          {t('wizard.openExisting')}
        </button>
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
