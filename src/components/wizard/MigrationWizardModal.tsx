import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { useUserPreferencesStore } from '@/stores/userPreferencesStore'
import { MigrationStepsGrid } from './MigrationStepsGrid'
import { ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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

  const [backupAnswer, setBackupAnswer] = useState<'yes' | 'no' | null>(null)
  const [cooldownDone, setCooldownDone] = useState(false)

  useEffect(() => {
    if (backupAnswer === null) {
      setCooldownDone(false)
      return
    }
    setCooldownDone(false)
    const timeout = setTimeout(() => {
      setCooldownDone(true)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [backupAnswer])

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

        {/* Backup question */}
        <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <ShieldExclamationIcon className="h-6 w-6 shrink-0 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text">
                {t('wizard.migrationBackupQuestion')}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {t('wizard.migrationBackupDetail')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              data-testid="wizard-backup-yes"
              onClick={() => setBackupAnswer('yes')}
              className={backupAnswer === 'yes'
                ? 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-success text-white border border-success'
                : backupAnswer === 'no'
                  ? 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-surface text-text-muted border border-border opacity-40'
                  : 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-surface text-text border border-border'
              }
            >
              {t('wizard.migrationBackupYes')}
            </button>
            <button
              type="button"
              data-testid="wizard-backup-no"
              onClick={() => setBackupAnswer('no')}
              className={backupAnswer === 'no'
                ? 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-amber-500 text-white border border-amber-500'
                : backupAnswer === 'yes'
                  ? 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-surface text-text-muted border border-border opacity-40'
                  : 'flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-surface text-text border border-border'
              }
            >
              {t('wizard.migrationBackupNo')}
            </button>
          </div>

          {/* Warning when No is selected */}
          {backupAnswer === 'no' && (
            <div
              data-testid="wizard-backup-warning"
              className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 p-3"
            >
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-800 dark:text-amber-300 mt-0.5" />
              <p className="text-xs leading-relaxed">
                {t('wizard.migrationBackupWarning')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <MigrationStepsGrid />
        </div>

        <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            data-testid="wizard-migration-continue"
            disabled={backupAnswer === null || !cooldownDone}
            className={`rounded-lg border border-border px-5 py-2 text-sm font-medium transition sm:w-auto ${
              backupAnswer === null || !cooldownDone
                ? 'cursor-not-allowed opacity-50 bg-surface text-text-muted'
                : 'bg-success text-white hover:opacity-90'
            }`}
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
