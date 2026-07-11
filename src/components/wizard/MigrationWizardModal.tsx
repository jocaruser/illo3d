import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'

interface MigrationWizardModalProps {
  shopVersion: string
  appVersion: string
  onLogOut: () => void
}

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const

export function MigrationWizardModal({
  shopVersion,
  appVersion,
  onLogOut,
}: MigrationWizardModalProps) {
  const { t } = useTranslation()
  const language = useUserPreferencesStore((s) => s.language)
  const setLanguage = useUserPreferencesStore((s) => s.setLanguage)

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <dialog
        open
        aria-labelledby="migration-wizard-title"
        className="relative w-full max-w-lg rounded-lg bg-surface-elevated p-6 shadow-xl sm:max-w-xl"
      >
        <div className="flex items-start justify-between">
          <h3 id="migration-wizard-title" className="text-lg font-semibold text-text">
            {t('wizard.migrationTitle')}
          </h3>
          <div className="flex gap-1">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => handleLanguageChange(code)}
                disabled={language === code}
                className={
                  language === code
                    ? 'rounded px-2 py-0.5 text-xs font-semibold text-success'
                    : 'rounded px-2 py-0.5 text-xs font-medium text-text-muted hover:bg-surface'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
          <p className="text-sm leading-relaxed text-text">
            {t('wizard.migrationDescriptionChanges')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text">
            {t('wizard.migrationDescriptionActions')}
          </p>
        </div>

        <div className="mt-5 flex flex-col justify-end gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            data-testid="wizard-migration-continue"
            disabled
            className="btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto"
          >
            {t('wizard.migrationContinue')}
          </button>
          <button
            type="button"
            data-testid="wizard-migration-logout"
            onClick={onLogOut}
            className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text hover:bg-surface sm:w-auto"
          >
            {t('wizard.migrationLogOut')}
          </button>
        </div>
      </dialog>
    </div>
  )
}
