import { act, renderHook } from '@testing-library/react'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

describe('useEntityManager', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    useWorkbookStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an EntityManager wired to the snapshot', () => {
    const { result } = renderHook(() => useEntityManager())

    expect(result.current.clients.findAll()).toEqual([])
  })

  it('keeps the same instance while the snapshot is untouched', () => {
    const { result, rerender } = renderHook(() => useEntityManager())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })

  it('rebuilds when the snapshot identity changes so reads stay fresh', () => {
    const { result } = renderHook(() => useEntityManager())
    const first = result.current

    act(() => {
      useWorkbookStore
        .getState()
        .mutateTab('clients', (matrix) => [...matrix, ['CL9', 'Ninth Client']])
    })

    expect(result.current).not.toBe(first)
  })
})
