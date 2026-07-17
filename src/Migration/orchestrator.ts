import { useMigrationStore } from '@/Store/migrationStore'
import type { MigrationPlan } from './MigrationPlan'
import { toErrorMessage, type ProgressReporter } from './MigrationStep'
import type { MigrationTarget, WorkingCopy } from './MigrationTarget'

export type RunResult = { ok: true } | { ok: false; failedAt: string }

type WorkingCopyResult =
  { ok: true; working: WorkingCopy } | { ok: false; error: string }

async function createWorkingCopySafely(
  target: MigrationTarget
): Promise<WorkingCopyResult> {
  try {
    return { ok: true, working: await target.createWorkingCopy() }
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) }
  }
}

/**
 * Drive a resolved plan chain against a migration target, streaming progress
 * through the migration store. Phases: 'backing-up' (create the working copy,
 * surfaced as the synthetic 'backup' step) → 'migrating' (every step of every
 * plan, in order) → 'committing' (atomic metadata flip) → 'done'.
 *
 * Any failure flips the phase to 'failed' and halts. The working copy is
 * deliberately left in place for inspection — the source shop is untouched
 * until commit succeeds.
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
  store.seedSteps(['backup', ...stepIds])

  store.setPhase('backing-up')
  store.updateStep('backup', { status: 'running' })
  const created = await createWorkingCopySafely(target)
  if (!created.ok) {
    store.updateStep('backup', { status: 'failed', error: created.error })
    store.setFailureMessage(created.error)
    store.setPhase('failed')
    return { ok: false, failedAt: 'backup' }
  }
  store.updateStep('backup', { status: 'done' })
  const { working } = created

  store.setPhase('migrating')
  for (const plan of plans) {
    for (const step of plan.steps) {
      store.updateStep(step.id, { status: 'running' })
      const report: ProgressReporter = {
        update: (i18nKey) =>
          store.updateStep(step.id, { description: i18nKey }),
      }
      const result = await step.execute(working.ctx, report)
      if (result.status === 'failed') {
        store.updateStep(step.id, { status: 'failed', error: result.error })
        store.setFailureMessage(result.error)
        store.setPhase('failed')
        return { ok: false, failedAt: step.id }
      }
      store.updateStep(step.id, { status: 'done' })
    }
  }

  store.setPhase('committing')
  try {
    await working.commit({ keepOriginalAsBackup: options.keepOriginalAsBackup })
  } catch (error) {
    const message = toErrorMessage(error)
    store.setFailureMessage(message)
    store.setPhase('failed')
    return { ok: false, failedAt: 'commit' }
  }

  store.setPhase('done')
  return { ok: true }
}
