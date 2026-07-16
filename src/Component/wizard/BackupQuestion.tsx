import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { cx } from '@/Component/cx'

/** Selected answers own the colour; the unselected one recedes. */
const YES_SELECTED =
  'border-transparent bg-green-600 text-white hover:bg-green-700'
const NO_SELECTED =
  'border-transparent bg-amber-500 text-white hover:bg-amber-600'
const DIMMED =
  'border-border bg-surface-elevated text-text-muted opacity-60 hover:opacity-100'

const BUTTON_BASE =
  'rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50'

interface BackupQuestionProps {
  /** null until answered; toggling the selected answer clears it again. */
  value: boolean | null
  onChange: (value: boolean | null) => void
  disabled?: boolean
}

export function BackupQuestion({
  value,
  onChange,
  disabled = false,
}: BackupQuestionProps) {
  const { t } = useTranslation()

  /** Clicking the selected answer deselects it — the question is answerable, not sticky. */
  const choose = (answer: boolean) => () => {
    onChange(value === answer ? null : answer)
  }

  return (
    <section className="rounded-md border border-border bg-surface-alt p-4">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">
            {t('wizard.migrationBackupQuestion')}
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              data-testid="wizard-backup-yes"
              aria-pressed={value === true}
              disabled={disabled}
              onClick={choose(true)}
              className={cx(
                BUTTON_BASE,
                value === true ? YES_SELECTED : DIMMED
              )}
            >
              {t('wizard.migrationBackupYes')}
            </button>
            <button
              type="button"
              data-testid="wizard-backup-no"
              aria-pressed={value === false}
              disabled={disabled}
              onClick={choose(false)}
              className={cx(
                BUTTON_BASE,
                value === false ? NO_SELECTED : DIMMED
              )}
            >
              {t('wizard.migrationBackupNo')}
            </button>
          </div>

          {value === true && (
            <p
              data-testid="wizard-backup-confirmed"
              className="mt-3 text-sm text-text-muted"
            >
              <span className="font-medium text-text">
                {t('wizard.migrationBackupResolvedYes')}
              </span>{' '}
              {t('wizard.migrationBackupDetail')}
            </p>
          )}

          {value === false && (
            <div
              role="alert"
              data-testid="wizard-backup-warning"
              className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200"
            >
              <p className="font-medium">
                {t('wizard.migrationBackupResolvedNo')}
              </p>
              <p className="mt-1">{t('wizard.migrationBackupWarning')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
