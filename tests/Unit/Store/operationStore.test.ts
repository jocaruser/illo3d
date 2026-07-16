import { useOperationStore } from '@/Store/operationStore'

describe('useOperationStore', () => {
  beforeEach(() => {
    useOperationStore.setState({ operation: null })
  })

  it('starts with no operation', () => {
    expect(useOperationStore.getState().operation).toBeNull()
  })

  it('start opens an operation at zero progress', () => {
    useOperationStore.getState().start('save', { total: 11, blocking: true, message: 'Saving…' })

    expect(useOperationStore.getState().operation).toEqual({
      kind: 'save',
      blocking: true,
      message: 'Saving…',
      total: 11,
      current: 0,
      sheetName: '',
    })
  })

  it('progress updates the current step and sheet name', () => {
    useOperationStore.getState().start('load', { total: 11, blocking: false, message: 'Loading…' })

    useOperationStore.getState().progress(3, 'inventory')

    expect(useOperationStore.getState().operation).toEqual({
      kind: 'load',
      blocking: false,
      message: 'Loading…',
      total: 11,
      current: 3,
      sheetName: 'inventory',
    })
  })

  it('progress without a running operation is a no-op', () => {
    const before = useOperationStore.getState()

    useOperationStore.getState().progress(5, 'jobs')

    expect(useOperationStore.getState()).toBe(before)
    expect(useOperationStore.getState().operation).toBeNull()
  })

  it('finish clears the operation', () => {
    useOperationStore.getState().start('save', { total: 2, blocking: true, message: 'Saving…' })
    useOperationStore.getState().progress(1, 'clients')

    useOperationStore.getState().finish()

    expect(useOperationStore.getState().operation).toBeNull()
  })

  it('start resets progress from any previous operation', () => {
    useOperationStore.getState().start('load', { total: 11, blocking: false, message: 'Loading…' })
    useOperationStore.getState().progress(7, 'lots')

    useOperationStore.getState().start('save', { total: 4, blocking: true, message: 'Saving…' })

    expect(useOperationStore.getState().operation).toEqual({
      kind: 'save',
      blocking: true,
      message: 'Saving…',
      total: 4,
      current: 0,
      sheetName: '',
    })
  })
})
