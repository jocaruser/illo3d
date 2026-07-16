import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudIcon, FolderOpenIcon } from '@heroicons/react/24/outline'

interface WelcomeStepProps {
  onChooseLocal: () => void
  onChooseGoogle: () => void
  disabled?: boolean
}

/**
 * The fork in the road. Both cards act immediately — picking a backend IS the
 * decision, so there is no intermediate "create or open?" screen for local:
 * the folder's own contents answer that question.
 */
export function WelcomeStep({
  onChooseLocal,
  onChooseGoogle,
  disabled = false,
}: WelcomeStepProps) {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-text">
        {t('wizard.welcomeTitle')}
      </h1>
      <p className="mt-2 text-center text-sm text-text-muted">
        {t('wizard.welcomeSubtitle')}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <BackendCard
          testId="wizard-local-folder"
          icon={<FolderOpenIcon className="h-8 w-8" aria-hidden="true" />}
          title={t('wizard.localFolder')}
          description={t('wizard.localFolderDesc')}
          disabled={disabled}
          onClick={onChooseLocal}
        />
        <BackendCard
          testId="wizard-google-drive"
          icon={<CloudIcon className="h-8 w-8" aria-hidden="true" />}
          title={t('wizard.googleDrive')}
          description={t('wizard.googleDriveDesc')}
          disabled={disabled}
          onClick={onChooseGoogle}
        />
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        {t('wizard.googleDriveOAuthHint')}
      </p>
    </div>
  )
}

interface BackendCardProps {
  testId: string
  icon: ReactNode
  title: string
  description: string
  disabled: boolean
  onClick: () => void
}

function BackendCard({
  testId,
  icon,
  title,
  description,
  disabled,
  onClick,
}: BackendCardProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className="card-hover-lift flex h-full flex-col items-center gap-3 rounded-lg border border-border bg-surface-elevated p-6 text-center shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="text-primary">{icon}</span>
      <span className="font-display text-lg font-semibold text-text">
        {title}
      </span>
      <span className="text-sm text-text-muted">{description}</span>
    </button>
  )
}
