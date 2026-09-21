import { useMigrationStore } from '@/Store/migrationStore'
import type { MigrationPlan } from './MigrationPlan'
import { toErrorMessage, type ProgressReporter } from './MigrationStep'
import type { MigrationSession, MigrationTarget } from './MigrationTarget'

export type RunResult =
  { ok: true; session: MigrationSession } | { ok: false; failedAt: string }

type SessionResult =
  { ok: true; session: MigrationSession } | { ok: false; error: string }

async function openSessionSafely(
  target: MigrationTarget
): Promise<SessionResult> {
  try {
    return { ok: true, session: await target.openSession() }
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) }
  }
}

/**
 * Drive a resolved plan chain against a migration target, streaming progress
 * through the migration store. Phases: 'backing-up' (optional pre-upgrade
 * backup) → 'migrating' (in-memory session + every plan step) →
 * 'awaiting-submit' (owner must confirm before persistence).
 */
export async function runPlans(
  plans: MigrationPlan[],
  target: MigrationTarget,
  options: { keepOriginalAsBackup: boolean }
): Promise<RunResult> {
  const store = useMigrationStore.getState()
  store.reset()
  const stepIds = [
    ...new Set(plans.flatMap((plan) => plan.steps.map((step) => step.id))),
  ]
  store.seedSteps(['backup', ...stepIds])

  store.setPhase('backing-up')
  if (options.keepOriginalAsBackup) {
    store.updateStep('backup', { status: 'running' })
    try {
      await target.writePreUpgradeBackup()
    } catch (error) {
      const message = toErrorMessage(error)
      store.updateStep('backup', { status: 'failed', error: message })
      store.setFailureMessage(message)
      store.setPhase('failed')
      return { ok: false, failedAt: 'backup' }
    }
    store.updateStep('backup', { status: 'done' })
  } else {
    const backupRow = store.steps.find((step) => step.id === 'backup')
    if (backupRow?.status === 'pending') {
      store.updateStep('backup', { status: 'done' })
    }
  }

  store.setPhase('migrating')
  const opened = await openSessionSafely(target)
  if (!opened.ok) {
    store.setFailureMessage(opened.error)
    store.setPhase('failed')
    return { ok: false, failedAt: 'backup' }
  }
  const { session } = opened

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

  store.setPhase('awaiting-submit')
  return { ok: true, session }
}
