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
        <h3 className="text-lg font-semibold text-text">{t('wizard.welcomeTitle')}</h3>
        <p className="mt-1 text-sm text-text-muted">{t('wizard.welcomeSubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          data-testid="wizard-local-folder"
          onClick={onSelectLocal}
          className="flex min-h-[120px] flex-col items-start rounded-lg border-2 border-border bg-surface-elevated p-4 text-left font-medium text-text shadow-sm transition hover:border-gray-400 hover:bg-surface"
        >
          <span className="text-base">{t('wizard.localFolder')}</span>
          <span className="mt-2 text-sm font-normal text-text-muted">
            {t('wizard.localFolderDesc')}
          </span>
        </button>
        <button
          type="button"
          data-testid="wizard-google-drive"
          onClick={onSelectGoogleDrive}
          className="flex min-h-[120px] flex-col items-start rounded-lg border-2 border-border bg-surface-elevated p-4 text-left font-medium text-text shadow-sm transition hover:border-gray-400 hover:bg-surface"
        >
          <span className="text-base">{t('wizard.googleDrive')}</span>
          <span className="mt-2 text-sm font-normal text-text-muted">
            {t('wizard.googleDriveDesc')}
          </span>
        </button>
      </div>
      {showGoogleDriveOAuthHint ? (
        <p className="text-sm text-text-muted" data-testid="wizard-google-oauth-hint">
          {t('wizard.googleDriveOAuthHint')}
        </p>
      ) : null}
    </div>
  )
}
