import { beforeEach, describe, expect, it } from 'vitest'
import { emptyMatrix } from '@/Repository/Matrix'
import { emptyTabs, useWorkbookStore } from '@/Store/workbookStore'

beforeEach(() => {
  useWorkbookStore.getState().reset()
})

describe('emptyTabs', () => {
  it('builds a header-only matrix for every sheet', () => {
    const tabs = emptyTabs()
    expect(tabs.jobs).toEqual(emptyMatrix('jobs'))
    expect(tabs.audit_log).toEqual(emptyMatrix('audit_log'))
    expect(Object.keys(tabs)).toHaveLength(11)
  })
})

describe('workbookStore', () => {
  it('starts idle, clean and empty', () => {
    const state = useWorkbookStore.getState()
    expect(state.status).toBe('idle')
    expect(state.dirty).toBe(false)
    expect(state.workbookId).toBeNull()
    expect(state.error).toBeNull()
    expect(state.saveInProgress).toBe(false)
    expect(state.mutatedDuringSave).toBe(false)
    expect(state.savedAuditRows).toBe(0)
  })

  it('hydrateTabs replaces the snapshot and marks ready + clean', () => {
    const tabs = emptyTabs()
    tabs.tags = [...tabs.tags, ['TG1', 'Vip', '', '', '']]
    useWorkbookStore.getState().mutateTab('jobs', (matrix) => matrix)
    useWorkbookStore.getState().hydrateTabs(tabs, 'wb-1')
    const state = useWorkbookStore.getState()
    expect(state.tabs.tags).toHaveLength(2)
    expect(state.workbookId).toBe('wb-1')
    expect(state.status).toBe('ready')
    expect(state.dirty).toBe(false)
    expect(state.mutatedDuringSave).toBe(false)
  })

  it('mutateTab applies the mutation and marks dirty', () => {
    useWorkbookStore
      .getState()
      .mutateTab('tags', (matrix) => [...matrix, ['TG1', 'Vip', '', '', '']])
    const state = useWorkbookStore.getState()
    expect(state.tabs.tags).toHaveLength(2)
    expect(state.dirty).toBe(true)
    expect(state.mutatedDuringSave).toBe(false)
  })

  it('setStatus stores the status and optional error', () => {
    useWorkbookStore.getState().setStatus('error', 'boom')
    expect(useWorkbookStore.getState().status).toBe('error')
    expect(useWorkbookStore.getState().error).toBe('boom')
    useWorkbookStore.getState().setStatus('loading')
    expect(useWorkbookStore.getState().error).toBeNull()
  })

  it('a clean save ends clean', () => {
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    useWorkbookStore.getState().beginSave()
    expect(useWorkbookStore.getState().saveInProgress).toBe(true)
    useWorkbookStore.getState().endSave(true)
    const state = useWorkbookStore.getState()
    expect(state.saveInProgress).toBe(false)
    expect(state.dirty).toBe(false)
  })

  it('a failed save stays dirty', () => {
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    useWorkbookStore.getState().beginSave()
    useWorkbookStore.getState().endSave(false)
    expect(useWorkbookStore.getState().dirty).toBe(true)
    expect(useWorkbookStore.getState().mutatedDuringSave).toBe(false)
  })

  it('mutations landing mid-save keep the store dirty after a successful save', () => {
    useWorkbookStore.getState().beginSave()
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    expect(useWorkbookStore.getState().mutatedDuringSave).toBe(true)
    useWorkbookStore.getState().endSave(true)
    const state = useWorkbookStore.getState()
    expect(state.dirty).toBe(true)
    expect(state.mutatedDuringSave).toBe(false)
  })

  it('hydrateTabs counts the persisted audit rows', () => {
    const tabs = emptyTabs()
    tabs.audit_log = [
      ...tabs.audit_log,
      ['AL1', '2026-01-01T00:00:00.000Z', 'local', 'tag', 'TG1', 'create', '', '{}', 'name', '', ''],
      ['AL2', '2026-01-02T00:00:00.000Z', 'local', 'tag', 'TG1', 'update', '{}', '{}', 'name', '', ''],
    ]
    useWorkbookStore.getState().hydrateTabs(tabs, 'wb-1')
    expect(useWorkbookStore.getState().savedAuditRows).toBe(2)
  })

  it('setSavedAuditRows records the persisted audit row count', () => {
    useWorkbookStore.getState().setSavedAuditRows(7)
    expect(useWorkbookStore.getState().savedAuditRows).toBe(7)
  })

  it('reset restores the initial state', () => {
    useWorkbookStore.getState().mutateTab('tags', (matrix) => matrix)
    useWorkbookStore.getState().setStatus('error', 'x')
    useWorkbookStore.getState().setSavedAuditRows(3)
    useWorkbookStore.getState().reset()
    const state = useWorkbookStore.getState()
    expect(state.status).toBe('idle')
    expect(state.dirty).toBe(false)
    expect(state.error).toBeNull()
    expect(state.tabs.tags).toEqual(emptyMatrix('tags'))
    expect(state.savedAuditRows).toBe(0)
  })
})
