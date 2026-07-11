import { useTranslation } from 'react-i18next'

interface MigrationWizardModalProps {
  shopVersion: string
  appVersion: string
  onLogOut: () => void
}

export function MigrationWizardModal({
  shopVersion,
  appVersion,
  onLogOut,
}: MigrationWizardModalProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <dialog
        open
        aria-labelledby="migration-wizard-title"
        className="relative w-full max-w-lg rounded-lg bg-surface-elevated p-6 shadow-xl sm:max-w-xl"
      >
        <h3 id="migration-wizard-title" className="text-lg font-semibold text-text">
          {t('wizard.migrationTitle')}
        </h3>

        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold tracking-tight text-text-muted sm:text-xl">
              {shopVersion}
            </span>
            <span className="mt-1 text-[11px] text-text-muted sm:text-xs">
              {t('wizard.migrationShopLabel')}
            </span>
          </div>
          <div className="flex items-center text-xl text-text-muted/40 sm:text-2xl">→</div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold tracking-tight text-success sm:text-xl">
              {appVersion}
            </span>
            <span className="mt-1 text-[11px] text-text-muted sm:text-xs">
              {t('wizard.migrationAppLabel')}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm leading-relaxed text-text-muted">
            {t('wizard.migrationDescriptionChanges')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            {t('wizard.migrationDescriptionActions')}
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            data-testid="wizard-migration-logout"
            onClick={onLogOut}
            className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text hover:bg-surface"
          >
            {t('wizard.migrationLogOut')}
          </button>
          <button
            type="button"
            data-testid="wizard-migration-continue"
            disabled
            className="btn-primary cursor-not-allowed opacity-50"
          >
            {t('wizard.migrationContinue')}
          </button>
        </div>
      </dialog>
    </div>
  )
}
