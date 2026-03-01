import { useTranslation } from 'react-i18next'

interface SuccessStepProps {
  folderName: string
  onContinue: () => void
  onClose: () => void
}

export function SuccessStep({
  folderName,
  onContinue,
  onClose,
}: SuccessStepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('wizard.success')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="text-xl leading-none">×</span>
        </button>
      </div>
      <p className="text-gray-600">
        {t('wizard.successMessage', { name: folderName })}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled
          className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
        >
          {t('wizard.startTour')}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('wizard.continue')}
        </button>
      </div>
    </div>
  )
}
