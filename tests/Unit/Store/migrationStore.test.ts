import { beforeEach, describe, expect, it } from 'vitest'
import { useMigrationStore } from '@/Store/migrationStore'

describe('migrationStore', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('starts idle with no steps and no failure message', () => {
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.steps).toEqual([])
    expect(state.failureMessage).toBeNull()
  })

  it('seeds pending steps in order', () => {
    useMigrationStore.getState().seedSteps(['backup', 'clients', 'jobs'])
    expect(useMigrationStore.getState().steps).toEqual([
      { id: 'backup', status: 'pending' },
      { id: 'clients', status: 'pending' },
      { id: 'jobs', status: 'pending' },
    ])
  })

  it('replaces previously seeded steps on re-seed', () => {
    useMigrationStore.getState().seedSteps(['clients'])
    useMigrationStore.getState().seedSteps(['jobs'])
    expect(useMigrationStore.getState().steps).toEqual([
      { id: 'jobs', status: 'pending' },
    ])
  })

  it('patches only the matching step', () => {
    useMigrationStore.getState().seedSteps(['clients', 'jobs'])
    useMigrationStore
      .getState()
      .updateStep('jobs', {
        status: 'running',
        description: 'wizard.migrationStepColumns',
      })
    expect(useMigrationStore.getState().steps).toEqual([
      { id: 'clients', status: 'pending' },
      {
        id: 'jobs',
        status: 'running',
        description: 'wizard.migrationStepColumns',
      },
    ])
  })

  it('merges successive patches on the same step', () => {
    useMigrationStore.getState().seedSteps(['clients'])
    useMigrationStore
      .getState()
      .updateStep('clients', { description: 'wizard.migrationStepColumns' })
    useMigrationStore
      .getState()
      .updateStep('clients', { status: 'failed', error: 'boom' })
    expect(useMigrationStore.getState().steps[0]).toEqual({
      id: 'clients',
      status: 'failed',
      description: 'wizard.migrationStepColumns',
      error: 'boom',
    })
  })

  it('sets the phase', () => {
    useMigrationStore.getState().setPhase('migrating')
    expect(useMigrationStore.getState().phase).toBe('migrating')
  })

  it('sets and clears the failure message', () => {
    useMigrationStore.getState().setFailureMessage('boom')
    expect(useMigrationStore.getState().failureMessage).toBe('boom')
    useMigrationStore.getState().setFailureMessage(null)
    expect(useMigrationStore.getState().failureMessage).toBeNull()
  })

  it('resets to the initial state', () => {
    useMigrationStore.getState().seedSteps(['clients'])
    useMigrationStore.getState().setPhase('failed')
    useMigrationStore.getState().setFailureMessage('boom')
    useMigrationStore.getState().reset()
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.steps).toEqual([])
    expect(state.failureMessage).toBeNull()
  })
})
