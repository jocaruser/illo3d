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
      doneSheets: [],
      failedSheets: [],
    })
  })

  it('progress updates the current step and collects the finished sheet', () => {
    useOperationStore.getState().start('load', { total: 11, blocking: false, message: 'Loading…' })

    useOperationStore.getState().progress(3, 'inventory')

    expect(useOperationStore.getState().operation).toEqual({
      kind: 'load',
      blocking: false,
      message: 'Loading…',
      total: 11,
      current: 3,
      sheetName: 'inventory',
      doneSheets: ['inventory'],
      failedSheets: [],
    })
  })

  it('progress accumulates done sheets in completion order', () => {
    useOperationStore.getState().start('save', { total: 3, blocking: false, message: 'Saving…' })

    useOperationStore.getState().progress(1, 'jobs')
    useOperationStore.getState().progress(2, 'clients')

    expect(useOperationStore.getState().operation?.doneSheets).toEqual(['jobs', 'clients'])
  })

  it('progress without a running operation is a no-op', () => {
    const before = useOperationStore.getState()

    useOperationStore.getState().progress(5, 'jobs')

    expect(useOperationStore.getState()).toBe(before)
    expect(useOperationStore.getState().operation).toBeNull()
  })

  it('fail records the sheet without touching progress', () => {
    useOperationStore.getState().start('save', { total: 3, blocking: false, message: 'Saving…' })
    useOperationStore.getState().progress(1, 'clients')

    useOperationStore.getState().fail('jobs')

    const operation = useOperationStore.getState().operation
    expect(operation?.failedSheets).toEqual(['jobs'])
    expect(operation?.doneSheets).toEqual(['clients'])
    expect(operation?.current).toBe(1)
  })

  it('fail without a running operation is a no-op', () => {
    const before = useOperationStore.getState()

    useOperationStore.getState().fail('jobs')

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
    useOperationStore.getState().fail('jobs')

    useOperationStore.getState().start('save', { total: 4, blocking: true, message: 'Saving…' })

    expect(useOperationStore.getState().operation).toEqual({
      kind: 'save',
      blocking: true,
      message: 'Saving…',
      total: 4,
      current: 0,
      sheetName: '',
      doneSheets: [],
      failedSheets: [],
    })
  })
})
