import { useTranslation } from 'react-i18next'

interface WelcomeStepProps {
  onSelectLocal: () => void
  onSelectGoogleDrive: () => void
  showGoogleDriveOAuthHint?: boolean
}

export function WelcomeStep({
  onSelectLocal,
  onSelectGoogleDrive,
  showGoogleDriveOAuthHint = false,
}: WelcomeStepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('wizard.welcomeTitle')}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('wizard.welcomeSubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          data-testid="wizard-local-folder"
          onClick={onSelectLocal}
          className="flex min-h-[120px] flex-col items-start rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 text-left font-medium text-gray-800 dark:text-gray-200 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="text-base">{t('wizard.localFolder')}</span>
          <span className="mt-2 text-sm font-normal text-gray-600 dark:text-gray-400">
            {t('wizard.localFolderDesc')}
          </span>
        </button>
        <button
          type="button"
          data-testid="wizard-google-drive"
          onClick={onSelectGoogleDrive}
          className="flex min-h-[120px] flex-col items-start rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 text-left font-medium text-gray-800 dark:text-gray-200 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="text-base">{t('wizard.googleDrive')}</span>
          <span className="mt-2 text-sm font-normal text-gray-600 dark:text-gray-400">
            {t('wizard.googleDriveDesc')}
          </span>
        </button>
      </div>
      {showGoogleDriveOAuthHint ? (
        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="wizard-google-oauth-hint">
          {t('wizard.googleDriveOAuthHint')}
        </p>
      ) : null}
    </div>
  )
}
