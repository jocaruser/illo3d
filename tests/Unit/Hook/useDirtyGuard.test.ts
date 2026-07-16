import { act, renderHook } from '@testing-library/react'
import { useDirtyGuard } from '@/Hook/useDirtyGuard'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

function fireBeforeUnload(): BeforeUnloadEvent {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
  window.dispatchEvent(event)
  return event
}

describe('useDirtyGuard', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    useWorkbookStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not warn while the workbook is clean', () => {
    renderHook(() => useDirtyGuard())

    expect(fireBeforeUnload().defaultPrevented).toBe(false)
  })

  it('warns once the workbook is dirty', () => {
    renderHook(() => useDirtyGuard())

    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })

    // jsdom models the legacy `returnValue` as the cancel flag's alias, so a
    // cancelled event reads back `false` — `defaultPrevented` is the signal.
    expect(fireBeforeUnload().defaultPrevented).toBe(true)
  })

  it('stops warning once the edits are saved', () => {
    renderHook(() => useDirtyGuard())
    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })

    act(() => {
      useWorkbookStore.getState().beginSave()
      useWorkbookStore.getState().endSave(true)
    })

    expect(fireBeforeUnload().defaultPrevented).toBe(false)
  })

  it('removes the listener on unmount', () => {
    const { unmount } = renderHook(() => useDirtyGuard())
    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })

    unmount()

    expect(fireBeforeUnload().defaultPrevented).toBe(false)
  })
})
