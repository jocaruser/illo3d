import { useMigrationStore } from '@/Store/migrationStore'
import type { MigrationPlan } from './MigrationPlan'
import { toErrorMessage, type ProgressReporter } from './MigrationStep'
import type { MigrationSession, MigrationTarget } from './MigrationTarget'

/** The first card of every run — the backup of the shop as it currently is. */
export const BACKUP_STEP_ID = 'backup'

/** Detail shown on the backup card when the user declined a backup. */
export const BACKUP_SKIPPED_KEY = 'wizard.migrationBackupSkipped'

export type RunResult =
  | { ok: true; session: MigrationSession }
  | { ok: false; failedAt: string }

/**
 * Drive a resolved plan chain against a migration target, streaming progress
 * through the migration store. Phases: 'backing-up' (read the shop into
 * memory, then write — or skip — the backup at its own step) → 'migrating'
 * (every step of every plan, against the in-memory copy) → 'ready'.
 *
 * Per ADR-0012 nothing persists here: the run ends 'ready' with the session
 * for `useMigration` to `persist` only when the user presses **Confirm and
 * close**. The backup is the one deliberate exception — written at its step,
 * it survives even a failed or abandoned run. Any failure flips the phase to
 * 'failed' and halts with the source shop untouched.
 */
export async function runPlans(
  plans: MigrationPlan[],
  target: MigrationTarget,
  options: { keepOriginalAsBackup: boolean }
): Promise<RunResult> {
  const store = useMigrationStore.getState()
  store.reset()
  // Chained plans may repeat an id (e.g. 'jobs' in both v1→v2 and v2→v3);
  // the wizard grid shows one row per entity, so seed each id once.
  const stepIds = [
    ...new Set(plans.flatMap((plan) => plan.steps.map((step) => step.id))),
  ]
  store.seedSteps([BACKUP_STEP_ID, ...stepIds])

  store.setPhase('backing-up')
  store.updateStep(BACKUP_STEP_ID, { status: 'running' })
  let session: MigrationSession
  try {
    session = await target.open()
    if (options.keepOriginalAsBackup) await session.writeBackup()
  } catch (error) {
    const message = toErrorMessage(error)
    store.updateStep(BACKUP_STEP_ID, { status: 'failed', error: message })
    store.setFailureMessage(message)
    store.setPhase('failed')
    return { ok: false, failedAt: BACKUP_STEP_ID }
  }
  store.updateStep(
    BACKUP_STEP_ID,
    options.keepOriginalAsBackup
      ? { status: 'done' }
      : { status: 'done', description: BACKUP_SKIPPED_KEY }
  )

  store.setPhase('migrating')
  for (const plan of plans) {
    for (const step of plan.steps) {
      store.updateStep(step.id, { status: 'running' })
      const report: ProgressReporter = {
        update: (i18nKey) =>
          store.updateStep(step.id, { description: i18nKey }),
      }
      const result = await step.execute(session.ctx, report)
      if (result.status === 'failed') {
        store.updateStep(step.id, { status: 'failed', error: result.error })
        store.setFailureMessage(result.error)
        store.setPhase('failed')
        return { ok: false, failedAt: step.id }
      }
      store.updateStep(step.id, { status: 'done' })
    }
  }

  store.setPhase('ready')
  return { ok: true, session }
}
