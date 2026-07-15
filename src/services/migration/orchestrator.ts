import type { MigrationStoreApi } from '@/stores/migrationStore'
import type { MigrationPlan } from './MigrationPlan'
import type { MigrationStep } from './MigrationStep'
import type { MigrationTarget, WorkingCopy } from './MigrationTarget'

export const BACKUP_STEP_ID = 'backup'

export interface StepFailure {
  step: MigrationStep
  error: string
  store: MigrationStoreApi
}

export interface MigrationErrorHandler {
  onStepFailed(failure: StepFailure): Promise<void> | void
}

// Recovery (retry, resume, cleanup) plugs in here later; for now a failure
// only surfaces in the store and the working copy is left for inspection.
export const defaultErrorHandler: MigrationErrorHandler = {
  onStepFailed({ step, error, store }) {
    store.updateStep(step.id, {
      status: 'failed',
      description: 'wizard.migrationStepFailed',
      error,
    })
    store.setPhase('failed')
  },
}

export interface RunPlanOptions {
  keepOriginalAsBackup: boolean
  onError?: MigrationErrorHandler
}

export interface RunPlanResult {
  success: boolean
  failedAt?: string
}

export async function runPlan(
  plan: MigrationPlan,
  target: MigrationTarget,
  store: MigrationStoreApi,
  options: RunPlanOptions
): Promise<RunPlanResult> {
  const onError = options.onError ?? defaultErrorHandler

  const working = await createWorkingCopy(target, store, options)
  if (!working) {
    return { success: false, failedAt: BACKUP_STEP_ID }
  }

  store.setPhase('migrating')
  for (const step of plan.steps) {
    const report = {
      update: (descriptionKey: string) =>
        store.updateStep(step.id, {
          status: 'running',
          description: descriptionKey,
        }),
    }
    report.update('wizard.migrationStepStarting')

    const result = await step.execute(working.ctx, report)
    if (result.status === 'failed') {
      await onError.onStepFailed({ step, error: result.error, store })
      return { success: false, failedAt: step.id }
    }
    store.updateStep(step.id, {
      status: 'done',
      description: 'wizard.migrationStepComplete',
    })
  }

  store.setPhase('committing')
  try {
    await working.commit({
      keepOriginalAsBackup: options.keepOriginalAsBackup,
    })
  } catch (error) {
    store.setFailureMessage(formatError(error))
    store.setPhase('failed')
    return { success: false, failedAt: 'commit' }
  }

  store.setPhase('done')
  return { success: true }
}

async function createWorkingCopy(
  target: MigrationTarget,
  store: MigrationStoreApi,
  options: RunPlanOptions
): Promise<WorkingCopy | null> {
  store.setPhase('backing-up')
  if (options.keepOriginalAsBackup) {
    store.updateStep(BACKUP_STEP_ID, {
      status: 'running',
      description: 'wizard.migrationStepBackupCreating',
    })
  }
  try {
    const working = await target.createWorkingCopy()
    if (options.keepOriginalAsBackup) {
      store.updateStep(BACKUP_STEP_ID, {
        status: 'done',
        description: 'wizard.migrationStepBackupDone',
      })
    }
    return working
  } catch (error) {
    const message = formatError(error)
    store.updateStep(BACKUP_STEP_ID, {
      status: 'failed',
      description: 'wizard.migrationStepFailed',
      error: message,
    })
    store.setFailureMessage(message)
    store.setPhase('failed')
    return null
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
