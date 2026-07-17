import { act, renderHook } from '@testing-library/react'
import { useConfirmDialog } from '@/Hook/useConfirmDialog'

describe('useConfirmDialog', () => {
  it('starts closed and idle', () => {
    const { result } = renderHook(() => useConfirmDialog())

    expect(result.current.open).toBe(false)
    expect(result.current.busy).toBe(false)
  })

  it('opens when an action is parked and runs it on confirm', async () => {
    const action = vi.fn()
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.ask(action)
    })
    expect(result.current.open).toBe(true)
    expect(action).not.toHaveBeenCalled()

    await act(() => result.current.confirm())

    expect(action).toHaveBeenCalledTimes(1)
    expect(result.current.open).toBe(false)
    expect(result.current.busy).toBe(false)
  })

  it('stays busy until an async action settles', async () => {
    let release: () => void = () => {}
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        })
    )
    const { result } = renderHook(() => useConfirmDialog())
    act(() => {
      result.current.ask(action)
    })

    let confirmed: Promise<void> = Promise.resolve()
    act(() => {
      confirmed = result.current.confirm()
    })
    expect(result.current.busy).toBe(true)

    await act(async () => {
      release()
      await confirmed
    })

    expect(result.current.busy).toBe(false)
    expect(result.current.open).toBe(false)
  })

  it('clears busy when the action throws', async () => {
    const action = vi.fn(() => Promise.reject(new Error('nope')))
    const { result } = renderHook(() => useConfirmDialog())
    act(() => {
      result.current.ask(action)
    })

    let error: unknown
    await act(async () => {
      error = await result.current.confirm().then(
        () => null,
        (reason: unknown) => reason
      )
    })

    expect((error as Error).message).toBe('nope')
    expect(result.current.busy).toBe(false)
    expect(result.current.open).toBe(false)
  })

  it('forgets the action on cancel', async () => {
    const action = vi.fn()
    const { result } = renderHook(() => useConfirmDialog())
    act(() => {
      result.current.ask(action)
    })

    act(() => {
      result.current.cancel()
    })
    expect(result.current.open).toBe(false)

    await act(() => result.current.confirm())

    expect(action).not.toHaveBeenCalled()
  })
})
