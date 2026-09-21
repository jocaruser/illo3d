import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'
import type { MigrationSession, MigrationTarget } from '@/Migration/MigrationTarget'
import { runPlans } from '@/Migration/orchestrator'
import { useMigrationStore } from '@/Store/migrationStore'
import { contextFor, InMemoryWorkbookRepository } from './helpers'

class FakeStep extends MigrationStep {
  constructor(
    readonly id: string,
    private readonly impl: (
      ctx: MigrationContext,
      report: ProgressReporter
    ) => Promise<void> = async () => {}
  ) {
    super()
  }

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    await this.impl(ctx, report)
  }
}

function plan(
  steps: MigrationStep[],
  overrides: Partial<MigrationPlan> = {}
): MigrationPlan {
  return { fromMajor: 1, toMajor: 2, toVersion: '2.0.0', steps, ...overrides }
}

function fakeTarget(
  submit = vi.fn(async () => {})
): {
  target: MigrationTarget
  submit: typeof submit
  writePreUpgradeBackup: ReturnType<typeof vi.fn>
} {
  const session: MigrationSession = {
    ctx: contextFor(new InMemoryWorkbookRepository()),
    submit,
  }
  const writePreUpgradeBackup = vi.fn(async () => {})
  return {
    target: {
      writePreUpgradeBackup,
      openSession: async () => session,
    },
    submit,
    writePreUpgradeBackup,
  }
}

function stepById(id: string) {
  return useMigrationStore.getState().steps.find((step) => step.id === id)
}

describe('runPlans', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('drives a successful run through every phase without auto-submit', async () => {
    const phases: string[] = []
    const unsubscribe = useMigrationStore.subscribe((state, previous) => {
      if (state.phase !== previous.phase) phases.push(state.phase)
    })
    const { target, submit, writePreUpgradeBackup } = fakeTarget()
    const result = await runPlans(
      [plan([new FakeStep('clients'), new FakeStep('jobs')])],
      target,
      { keepOriginalAsBackup: true }
    )
    unsubscribe()

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.session).toBeDefined()
    expect(phases).toEqual(['backing-up', 'migrating', 'awaiting-submit'])
    expect(writePreUpgradeBackup).toHaveBeenCalledOnce()
    expect(submit).not.toHaveBeenCalled()
    expect(stepById('backup')?.status).toBe('done')
    expect(stepById('clients')?.status).toBe('done')
    expect(stepById('jobs')?.status).toBe('done')
    expect(useMigrationStore.getState().failureMessage).toBeNull()
  })

  it('skips writePreUpgradeBackup when the user declined a backup', async () => {
    const { target, writePreUpgradeBackup } = fakeTarget()
    await runPlans([plan([])], target, { keepOriginalAsBackup: false })
    expect(writePreUpgradeBackup).not.toHaveBeenCalled()
  })

  it('streams step description keys reported during migrate', async () => {
    const { target } = fakeTarget()
    const step = new FakeStep('clients', async (_ctx, report) => {
      report.update('wizard.migrationStepColumns')
    })
    await runPlans([plan([step])], target, { keepOriginalAsBackup: false })
    expect(stepById('clients')?.description).toBe('wizard.migrationStepColumns')
  })

  it('seeds a repeated step id only once across chained plans', async () => {
    const { target } = fakeTarget()
    await runPlans(
      [
        plan([new FakeStep('jobs')]),
        plan([new FakeStep('jobs')], {
          fromMajor: 2,
          toMajor: 3,
          toVersion: '3.0.0',
        }),
      ],
      target,
      { keepOriginalAsBackup: false }
    )
    const ids = useMigrationStore.getState().steps.map((step) => step.id)
    expect(ids).toEqual(['backup', 'jobs'])
    expect(stepById('jobs')?.status).toBe('done')
  })

  it('fails the backup step when writePreUpgradeBackup throws', async () => {
    const target: MigrationTarget = {
      writePreUpgradeBackup: async () => {
        throw new Error('no disk space')
      },
      openSession: async () => {
        throw new Error('should not open')
      },
    }
    const result = await runPlans([plan([new FakeStep('clients')])], target, {
      keepOriginalAsBackup: true,
    })
    expect(result).toEqual({ ok: false, failedAt: 'backup' })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('failed')
    expect(state.failureMessage).toBe('no disk space')
    expect(stepById('backup')).toEqual({
      id: 'backup',
      status: 'failed',
      error: 'no disk space',
    })
    expect(stepById('clients')?.status).toBe('pending')
  })

  it('fails when openSession throws', async () => {
    const target: MigrationTarget = {
      writePreUpgradeBackup: async () => {},
      openSession: async () => {
        throw 'permission denied'
      },
    }
    const result = await runPlans([plan([])], target, {
      keepOriginalAsBackup: false,
    })
    expect(result).toEqual({ ok: false, failedAt: 'backup' })
    expect(useMigrationStore.getState().failureMessage).toBe(
      'permission denied'
    )
  })

  it('halts on the first failing step and never submits', async () => {
    const { target, submit } = fakeTarget()
    const failing = new FakeStep('jobs', async () => {
      throw new Error('header mismatch')
    })
    const result = await runPlans(
      [plan([new FakeStep('clients'), failing, new FakeStep('inventory')])],
      target,
      { keepOriginalAsBackup: true }
    )
    expect(result).toEqual({ ok: false, failedAt: 'jobs' })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('failed')
    expect(state.failureMessage).toBe('header mismatch')
    expect(stepById('clients')?.status).toBe('done')
    expect(stepById('jobs')).toMatchObject({
      status: 'failed',
      error: 'header mismatch',
    })
    expect(stepById('inventory')?.status).toBe('pending')
    expect(submit).not.toHaveBeenCalled()
  })

  it('resets stale state from a previous run before starting', async () => {
    useMigrationStore.getState().seedSteps(['stale'])
    useMigrationStore.getState().setPhase('failed')
    useMigrationStore.getState().setFailureMessage('old failure')
    const { target } = fakeTarget()
    await runPlans([plan([new FakeStep('clients')])], target, {
      keepOriginalAsBackup: false,
    })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('awaiting-submit')
    expect(state.failureMessage).toBeNull()
    expect(stepById('stale')).toBeUndefined()
  })
})
