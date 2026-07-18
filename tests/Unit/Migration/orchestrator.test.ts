import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type { MigrationPlan } from '@/Migration/MigrationPlan'
import { MigrationStep, type ProgressReporter } from '@/Migration/MigrationStep'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { BACKUP_SKIPPED_KEY, runPlans } from '@/Migration/orchestrator'
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
  overrides: Partial<Record<'writeBackup' | 'persist', () => Promise<void>>> = {}
) {
  const writeBackup = vi.fn(overrides.writeBackup ?? (async () => {}))
  const persist = vi.fn(overrides.persist ?? (async () => {}))
  const session: MigrationSession = {
    ctx: contextFor(new InMemoryWorkbookRepository()),
    writeBackup,
    persist,
  }
  const target: MigrationTarget = { open: async () => session }
  return { target, session, writeBackup, persist }
}

function stepById(id: string) {
  return useMigrationStore.getState().steps.find((step) => step.id === id)
}

describe('runPlans', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('drives a successful run to ready without persisting anything', async () => {
    const phases: string[] = []
    const unsubscribe = useMigrationStore.subscribe((state, previous) => {
      if (state.phase !== previous.phase) phases.push(state.phase)
    })
    const { target, session, writeBackup, persist } = fakeTarget()
    const result = await runPlans(
      [plan([new FakeStep('clients'), new FakeStep('jobs')])],
      target,
      { keepOriginalAsBackup: true }
    )
    unsubscribe()

    expect(result).toEqual({ ok: true, session })
    expect(phases).toEqual(['backing-up', 'migrating', 'ready'])
    expect(writeBackup).toHaveBeenCalledTimes(1)
    expect(persist).not.toHaveBeenCalled()
    expect(stepById('backup')?.status).toBe('done')
    expect(stepById('clients')?.status).toBe('done')
    expect(stepById('jobs')?.status).toBe('done')
    expect(useMigrationStore.getState().failureMessage).toBeNull()
  })

  it('skips the backup write and marks the card Skipped when declined', async () => {
    const { target, writeBackup } = fakeTarget()
    const result = await runPlans([plan([])], target, {
      keepOriginalAsBackup: false,
    })
    expect(result).toMatchObject({ ok: true })
    expect(writeBackup).not.toHaveBeenCalled()
    expect(stepById('backup')).toEqual({
      id: 'backup',
      status: 'done',
      description: BACKUP_SKIPPED_KEY,
    })
  })

  it('runs every step against the one in-memory session context', async () => {
    const { target, session } = fakeTarget()
    const seen: MigrationContext[] = []
    const step = new FakeStep('clients', async (ctx) => {
      seen.push(ctx)
    })
    await runPlans([plan([step])], target, { keepOriginalAsBackup: false })
    expect(seen).toEqual([session.ctx])
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

  it('fails the backup step when the shop cannot be read into memory', async () => {
    const target: MigrationTarget = {
      open: async () => {
        throw new Error('folder unreadable')
      },
    }
    const result = await runPlans([plan([new FakeStep('clients')])], target, {
      keepOriginalAsBackup: false,
    })
    expect(result).toEqual({ ok: false, failedAt: 'backup' })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('failed')
    expect(state.failureMessage).toBe('folder unreadable')
    expect(stepById('backup')).toEqual({
      id: 'backup',
      status: 'failed',
      error: 'folder unreadable',
    })
    expect(stepById('clients')?.status).toBe('pending')
  })

  it('fails the backup step when the backup copy cannot be written', async () => {
    const { target } = fakeTarget({
      writeBackup: async () => {
        throw new Error('no disk space')
      },
    })
    const result = await runPlans([plan([new FakeStep('clients')])], target, {
      keepOriginalAsBackup: true,
    })
    expect(result).toEqual({ ok: false, failedAt: 'backup' })
    expect(useMigrationStore.getState().failureMessage).toBe('no disk space')
    expect(stepById('backup')?.status).toBe('failed')
    expect(stepById('clients')?.status).toBe('pending')
  })

  it('stringifies non-Error open failures', async () => {
    const target: MigrationTarget = {
      open: async () => {
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

  it('halts on the first failing step and never reaches ready', async () => {
    const { target, persist } = fakeTarget()
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
    expect(persist).not.toHaveBeenCalled()
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
    expect(state.phase).toBe('ready')
    expect(state.failureMessage).toBeNull()
    expect(stepById('stale')).toBeUndefined()
  })
})
