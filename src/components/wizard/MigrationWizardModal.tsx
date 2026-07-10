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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-wizard-title"
        className="w-full max-w-md rounded-lg bg-surface-elevated p-6 shadow-xl"
      >
        <h3 id="migration-wizard-title" className="text-lg font-semibold text-text">
          {t('wizard.migrationTitle')}
        </h3>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-text">{shopVersion}</span>
            <span className="mt-1 text-xs text-text-muted">{t('wizard.migrationShopLabel')}</span>
          </div>
          <div className="flex items-center text-2xl text-text-muted/40">→</div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-brand">{appVersion}</span>
            <span className="mt-1 text-xs text-text-muted">{t('wizard.migrationAppLabel')}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
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
      </div>
    </div>
  )
}
