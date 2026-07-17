import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { AlertBox } from '@/Component/AlertBox'
import { trapFocusKeyDown } from '@/Component/dialog/trapFocus'
import { LanguageToggle } from '@/Component/LanguageToggle'
import { ThemeToggle } from '@/Component/ThemeToggle'
import { useMigration } from '@/Hook/useMigration'
import type { MigrationCandidate } from '@/Hook/useOpenShop'
import { useMigrationStore } from '@/Store/migrationStore'
import { BackupQuestion } from './BackupQuestion'
import { CooldownContinueButton } from './CooldownContinueButton'
import { MigrationStepsGrid } from './MigrationStepsGrid'
import { doneCount, migrationStepStates } from './migrationSteps'

interface MigrationWizardModalProps {
  candidate: MigrationCandidate
  onLogOut: () => void
}

/**
 * Shown when a shop's major version trails the app's, on both backends. The
 * user picks whether to keep a backup, waits out a short cooldown, then runs
 * the migration — which enters the shop on success, unmounting this modal.
 */
export function MigrationWizardModal({
  candidate,
  onLogOut,
}: MigrationWizardModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const [keepOriginalAsBackup, setKeepOriginalAsBackup] = useState<
    boolean | null
  >(null)
  const [busy, setBusy] = useState(false)
  const { start } = useMigration()
  const phase = useMigrationStore((state) => state.phase)
  const liveSteps = useMigrationStore((state) => state.steps)
  const failureMessage = useMigrationStore((state) => state.failureMessage)

  const rows = migrationStepStates(
    phase,
    liveSteps,
    candidate.shopVersion,
    keepOriginalAsBackup
  )
  const done = doneCount(rows)
  const allDone = rows.length > 0 && done === rows.length

  // Null until the backup question is answered — which is exactly what makes
  // Continue eligible, so the button needs no separate "ready" flag.
  const runMigration =
    keepOriginalAsBackup === null
      ? null
      : async () => {
          setBusy(true)
          await start({
            folderId: candidate.folderId,
            shopVersion: candidate.shopVersion,
            keepOriginalAsBackup,
          })
          setBusy(false)
        }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocusKeyDown}
        className="my-auto w-full max-w-3xl rounded-lg border border-border bg-surface-elevated p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-display text-2xl font-semibold text-text"
          >
            {t('wizard.migrationTitle')}
          </h2>
          {/* Same preference controls as the welcome screen — a migrating
              user has not reached the profile menu yet. */}
          <div className="flex shrink-0 gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        <VersionComparison
          shopVersion={candidate.shopVersion}
          appVersion={candidate.appVersion}
        />

        <div className="mt-4 space-y-2 text-sm text-text-muted">
          <p>{t('wizard.migrationDescriptionChanges')}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-text">
                {t('wizard.migrationDescriptionLabel1')}
              </span>
              {' — '}
              {t('wizard.migrationDescriptionItem1')}
            </li>
            <li>
              <span className="font-medium text-text">
                {t('wizard.migrationDescriptionLabel2')}
              </span>
              {' — '}
              {t('wizard.migrationDescriptionItem2')}
            </li>
          </ul>
          <p>{t('wizard.migrationDescriptionActions')}</p>
        </div>

        <div className="mt-4">
          <BackupQuestion
            value={keepOriginalAsBackup}
            onChange={setKeepOriginalAsBackup}
            disabled={busy}
          />
        </div>

        <p
          data-testid="wizard-migration-summary"
          className="mt-4 text-sm font-medium text-text-muted"
        >
          {allDone
            ? t('wizard.migrationAllDone')
            : t('wizard.migrationSummary', { done, total: rows.length })}
        </p>

        <div className="mt-2">
          <MigrationStepsGrid
            shopVersion={candidate.shopVersion}
            keepOriginalAsBackup={keepOriginalAsBackup}
          />
        </div>

        {phase === 'failed' && (
          <div data-testid="wizard-migration-failed" className="mt-4">
            <AlertBox variant="danger">
              <p className="font-medium">{t('wizard.migrationFailedTitle')}</p>
              {failureMessage !== null && (
                <p className="mt-1">{failureMessage}</p>
              )}
            </AlertBox>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-testid="wizard-migration-logout"
            className="btn-secondary"
            disabled={busy}
            onClick={onLogOut}
          >
            {t('wizard.migrationLogOut')}
          </button>
          <CooldownContinueButton
            label={t('wizard.migrationContinue')}
            resetKey={String(keepOriginalAsBackup)}
            busy={busy}
            onClick={runMigration === null ? null : () => void runMigration()}
          />
        </div>
      </div>
    </div>
  )
}

interface VersionComparisonProps {
  shopVersion: string
  appVersion: string
}

function VersionComparison({
  shopVersion,
  appVersion,
}: VersionComparisonProps) {
  const { t } = useTranslation()
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <VersionChip
        label={t('wizard.migrationShopLabel')}
        version={shopVersion}
      />
      <ArrowRightIcon
        className="h-4 w-4 shrink-0 text-text-muted"
        aria-hidden="true"
      />
      <VersionChip
        label={t('wizard.migrationAppLabel')}
        version={appVersion}
        highlight
      />
    </div>
  )
}

interface VersionChipProps {
  label: string
  version: string
  highlight?: boolean
}

function VersionChip({ label, version, highlight = false }: VersionChipProps) {
  return (
    <div className="rounded-md border border-border bg-surface-alt px-3 py-2">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={
          highlight ? 'font-medium text-primary' : 'font-medium text-text'
        }
      >
        {version}
      </p>
    </div>
  )
}
