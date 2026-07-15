import { describe, it, expect, beforeEach } from 'vitest'
import { useMigrationStore } from './migrationStore'

describe('migrationStore', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('starts idle with no steps', () => {
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.steps).toEqual([])
    expect(state.failureMessage).toBeNull()
  })

  it('seedSteps replaces the step list', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'backup', status: 'pending' },
      { id: 'clients', status: 'pending' },
    ])
    expect(useMigrationStore.getState().steps).toHaveLength(2)
  })

  it('updateStep patches only the matching step', () => {
    useMigrationStore.getState().seedSteps([
      { id: 'backup', status: 'pending' },
      { id: 'clients', status: 'pending' },
    ])
    useMigrationStore.getState().updateStep('clients', {
      status: 'running',
      description: 'wizard.migrationStepAddingColumns',
    })
    const [backup, clients] = useMigrationStore.getState().steps
    expect(backup).toEqual({ id: 'backup', status: 'pending' })
    expect(clients).toEqual({
      id: 'clients',
      status: 'running',
      description: 'wizard.migrationStepAddingColumns',
    })
  })

  it('updateStep keeps previous fields when patching', () => {
    useMigrationStore.getState().seedSteps([{ id: 'jobs', status: 'running', description: 'a' }])
    useMigrationStore.getState().updateStep('jobs', { status: 'failed', error: 'boom' })
    expect(useMigrationStore.getState().steps[0]).toEqual({
      id: 'jobs',
      status: 'failed',
      description: 'a',
      error: 'boom',
    })
  })

  it('setPhase and setFailureMessage update state', () => {
    useMigrationStore.getState().setPhase('migrating')
    useMigrationStore.getState().setFailureMessage('broken')
    expect(useMigrationStore.getState().phase).toBe('migrating')
    expect(useMigrationStore.getState().failureMessage).toBe('broken')
  })

  it('reset returns to the initial state', () => {
    useMigrationStore.getState().seedSteps([{ id: 'backup', status: 'done' }])
    useMigrationStore.getState().setPhase('failed')
    useMigrationStore.getState().setFailureMessage('broken')
    useMigrationStore.getState().reset()
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.steps).toEqual([])
    expect(state.failureMessage).toBeNull()
  })
})
