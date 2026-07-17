import { installFakeLocalStorage } from './memoryLocalStorage'

async function freshBackendStore() {
  vi.resetModules()
  const { useBackendStore } = await import('@/Store/backendStore')
  return useBackendStore
}

function persistedState(): Record<string, unknown> {
  const raw = localStorage.getItem('backend-storage')
  expect(raw).not.toBeNull()
  return (JSON.parse(raw as string) as { state: Record<string, unknown> }).state
}

const fakeHandle = { kind: 'directory', name: 'my-shop' } as FileSystemDirectoryHandle

describe('useBackendStore', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with no backend and no directory handle', async () => {
    const useBackendStore = await freshBackendStore()

    expect(useBackendStore.getState()).toMatchObject({
      backend: null,
      localDirectoryHandle: null,
    })
  })

  it('setBackend stores and persists the choice', async () => {
    const useBackendStore = await freshBackendStore()

    useBackendStore.getState().setBackend('google-drive')
    expect(useBackendStore.getState().backend).toBe('google-drive')
    expect(persistedState()).toEqual({ backend: 'google-drive' })

    useBackendStore.getState().setBackend('local-csv')
    expect(useBackendStore.getState().backend).toBe('local-csv')
    expect(persistedState()).toEqual({ backend: 'local-csv' })
  })

  it('setLocalDirectoryHandle keeps the handle in memory only', async () => {
    const useBackendStore = await freshBackendStore()
    useBackendStore.getState().setBackend('local-csv')

    useBackendStore.getState().setLocalDirectoryHandle(fakeHandle)

    expect(useBackendStore.getState().localDirectoryHandle).toBe(fakeHandle)
    expect(persistedState()).toEqual({ backend: 'local-csv' })
    expect(localStorage.getItem('backend-storage')).not.toContain('my-shop')
  })

  it('setLocalDirectoryHandle accepts null to release the handle', async () => {
    const useBackendStore = await freshBackendStore()
    useBackendStore.getState().setLocalDirectoryHandle(fakeHandle)

    useBackendStore.getState().setLocalDirectoryHandle(null)

    expect(useBackendStore.getState().localDirectoryHandle).toBeNull()
  })

  it('clearBackend resets the choice and the handle', async () => {
    const useBackendStore = await freshBackendStore()
    useBackendStore.getState().setBackend('local-csv')
    useBackendStore.getState().setLocalDirectoryHandle(fakeHandle)

    useBackendStore.getState().clearBackend()

    expect(useBackendStore.getState()).toMatchObject({
      backend: null,
      localDirectoryHandle: null,
    })
    expect(persistedState()).toEqual({ backend: null })
  })

  it('rehydrates the backend choice from storage', async () => {
    localStorage.setItem(
      'backend-storage',
      JSON.stringify({ state: { backend: 'google-drive' }, version: 0 })
    )

    const useBackendStore = await freshBackendStore()

    expect(useBackendStore.getState().backend).toBe('google-drive')
    expect(useBackendStore.getState().localDirectoryHandle).toBeNull()
  })
})
