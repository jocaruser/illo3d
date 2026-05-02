import { useOperationToastStore } from './operationToastStore'

describe('OperationToastStore', () => {
  beforeEach(() => {
    useOperationToastStore.setState({
      operation: null,
      phase: null,
      current: 0,
      total: 0,
      sheetName: '',
      message: '',
      blocking: false,
    })
  })

  it('initializes with blocking: false', () => {
    const state = useOperationToastStore.getState()
    expect(state.blocking).toBe(false)
  })

  it('start() with blocking: true sets the flag', () => {
    const store = useOperationToastStore.getState()
    store.start('save', 10, true)
    const state = useOperationToastStore.getState()
    expect(state.blocking).toBe(true)
    expect(state.operation).toBe('save')
  })

  it('start() without blocking parameter defaults to false', () => {
    const store = useOperationToastStore.getState()
    store.start('load', 10)
    const state = useOperationToastStore.getState()
    expect(state.blocking).toBe(false)
  })

  it('setBlocking() updates the blocking flag', () => {
    const store = useOperationToastStore.getState()
    store.setBlocking(true)
    expect(useOperationToastStore.getState().blocking).toBe(true)
    store.setBlocking(false)
    expect(useOperationToastStore.getState().blocking).toBe(false)
  })

  it('dismiss() clears the blocking flag', () => {
    const store = useOperationToastStore.getState()
    store.start('save', 10, true)
    expect(useOperationToastStore.getState().blocking).toBe(true)
    store.dismiss()
    const state = useOperationToastStore.getState()
    expect(state.blocking).toBe(false)
    expect(state.operation).toBeNull()
  })
})
