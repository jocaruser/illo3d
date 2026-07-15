import { describe, it, expect, vi } from 'vitest'
import type { MigrationStoreApi } from '@/stores/migrationStore'
import type { MigrationContext } from './MigrationContext'
import type { MigrationPlan } from './MigrationPlan'
import { MigrationStep, type ProgressReporter } from './MigrationStep'
import type { MigrationTarget, WorkingCopy } from './MigrationTarget'
import { runPlan } from './orchestrator'

class FakeStep extends MigrationStep {
  constructor(
    readonly id: string,
    private readonly behavior: (report: ProgressReporter) => Promise<void> = async () => {}
  ) {
    super()
  }

  get label() {
    return this.id
  }

  protected migrate(
    _ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    return this.behavior(report)
  }
}

function fakeContext(): MigrationContext {
  return {
    backend: 'local-csv',
    workingSpreadsheetId: 'local-working',
    repo: {} as MigrationContext['repo'],
    ensureSheet: async () => {},
  }
}

function fakeTarget(overrides: Partial<WorkingCopy> = {}): {
  target: MigrationTarget
  commit: ReturnType<typeof vi.fn>
} {
  const commit = vi.fn(async () => {})
  const target: MigrationTarget = {
    createWorkingCopy: async () => ({
      ctx: fakeContext(),
      commit,
      ...overrides,
    }),
  }
  return { target, commit }
}

function fakeStore() {
  return {
    setPhase: vi.fn(),
    updateStep: vi.fn(),
    setFailureMessage: vi.fn(),
  } satisfies MigrationStoreApi
}

function planWith(steps: MigrationStep[]): MigrationPlan {
  return { fromMajor: 1, toMajor: 2, toVersion: '2.0.0', steps }
}

describe('runPlan', () => {
  it('runs phases in order and commits on success', async () => {
    const { target, commit } = fakeTarget()
    const store = fakeStore()
    const plan = planWith([new FakeStep('clients'), new FakeStep('jobs')])

    const result = await runPlan(plan, target, store, {
      keepOriginalAsBackup: true,
    })

    expect(result).toEqual({ success: true })
    expect(store.setPhase.mock.calls.map(([phase]) => phase)).toEqual([
      'backing-up',
      'migrating',
      'committing',
      'done',
    ])
    expect(commit).toHaveBeenCalledWith({ keepOriginalAsBackup: true })
  })

  it('marks each step running then done', async () => {
    const { target } = fakeTarget()
    const store = fakeStore()
    const plan = planWith([
      new FakeStep('clients', async (report) => {
        report.update('wizard.migrationStepAddingColumns')
      }),
    ])

    await runPlan(plan, target, store, { keepOriginalAsBackup: false })

    expect(store.updateStep).toHaveBeenCalledWith('clients', {
      status: 'running',
      description: 'wizard.migrationStepStarting',
    })
    expect(store.updateStep).toHaveBeenCalledWith('clients', {
      status: 'running',
      description: 'wizard.migrationStepAddingColumns',
    })
    expect(store.updateStep).toHaveBeenCalledWith('clients', {
      status: 'done',
      description: 'wizard.migrationStepComplete',
    })
  })

  it('animates the backup card only when the original is kept as backup', async () => {
    const { target } = fakeTarget()
    const store = fakeStore()

    await runPlan(planWith([]), target, store, { keepOriginalAsBackup: true })
    expect(store.updateStep).toHaveBeenCalledWith('backup', {
      status: 'running',
      description: 'wizard.migrationStepBackupCreating',
    })
    expect(store.updateStep).toHaveBeenCalledWith('backup', {
      status: 'done',
      description: 'wizard.migrationStepBackupDone',
    })

    const skippingStore = fakeStore()
    await runPlan(planWith([]), target, skippingStore, {
      keepOriginalAsBackup: false,
    })
    expect(skippingStore.updateStep).not.toHaveBeenCalledWith(
      'backup',
      expect.anything()
    )
  })

  it('stops on the first failing step and leaves later steps untouched', async () => {
    const { target, commit } = fakeTarget()
    const store = fakeStore()
    const laterStep = new FakeStep('jobs')
    const migrateSpy = vi.spyOn(
      laterStep as unknown as { migrate: () => Promise<void> },
      'migrate'
    )
    const plan = planWith([
      new FakeStep('clients', async () => {
        throw new Error('columns exploded')
      }),
      laterStep,
    ])

    const result = await runPlan(plan, target, store, {
      keepOriginalAsBackup: false,
    })

    expect(result).toEqual({ success: false, failedAt: 'clients' })
    expect(store.updateStep).toHaveBeenCalledWith('clients', {
      status: 'failed',
      description: 'wizard.migrationStepFailed',
      error: 'columns exploded',
    })
    expect(store.setPhase).toHaveBeenCalledWith('failed')
    expect(migrateSpy).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('uses a custom error handler when provided', async () => {
    const { target } = fakeTarget()
    const store = fakeStore()
    const onStepFailed = vi.fn()
    const plan = planWith([
      new FakeStep('clients', async () => {
        throw new Error('boom')
      }),
    ])

    await runPlan(plan, target, store, {
      keepOriginalAsBackup: false,
      onError: { onStepFailed },
    })

    expect(onStepFailed).toHaveBeenCalledWith({
      step: plan.steps[0],
      error: 'boom',
      store,
    })
  })

  it('fails the backup card when the working copy cannot be created', async () => {
    const target: MigrationTarget = {
      createWorkingCopy: async () => {
        throw new Error('quota exceeded')
      },
    }
    const store = fakeStore()

    const result = await runPlan(
      planWith([new FakeStep('clients')]),
      target,
      store,
      { keepOriginalAsBackup: true }
    )

    expect(result).toEqual({ success: false, failedAt: 'backup' })
    expect(store.updateStep).toHaveBeenCalledWith('backup', {
      status: 'failed',
      description: 'wizard.migrationStepFailed',
      error: 'quota exceeded',
    })
    expect(store.setFailureMessage).toHaveBeenCalledWith('quota exceeded')
    expect(store.setPhase).toHaveBeenCalledWith('failed')
    expect(store.updateStep).not.toHaveBeenCalledWith(
      'clients',
      expect.anything()
    )
  })

  it('reports a commit failure without reaching the done phase', async () => {
    const { target, commit } = fakeTarget()
    commit.mockRejectedValue(new Error('swap failed'))
    const store = fakeStore()

    const result = await runPlan(planWith([]), target, store, {
      keepOriginalAsBackup: false,
    })

    expect(result).toEqual({ success: false, failedAt: 'commit' })
    expect(store.setFailureMessage).toHaveBeenCalledWith('swap failed')
    expect(store.setPhase).toHaveBeenCalledWith('failed')
    expect(store.setPhase).not.toHaveBeenCalledWith('done')
  })
})
