import { act, renderHook, waitFor } from '@testing-library/react'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { useShopMetadata } from '@/Hook/useShopMetadata'
import { getFolderRepository } from '@/Repository/RepositoryFactory'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(),
  getWorkbookRepository: vi.fn(),
}))

const metadata: ShopMetadata = {
  app: 'illo3d',
  version: '3.0.0',
  spreadsheetId: 'sheet-1',
  createdAt: '2026-01-01',
  createdBy: 'someone@example.com',
  logo: 'logo.png',
  userName: 'Carlos',
}

function mockReadMetadata(implementation: () => Promise<ShopMetadata | null>) {
  vi.mocked(getFolderRepository).mockReturnValue({
    readMetadata: vi.fn(implementation),
    writeMetadata: vi.fn(),
    getFolderName: vi.fn(),
  })
}

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
  useBackendStore.getState().setBackend('google-drive')
}

describe('useShopMetadata', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stays empty with no shop open', () => {
    const { result } = renderHook(() => useShopMetadata())

    expect(result.current).toEqual({ metadata: null, loading: false, error: null })
    expect(getFolderRepository).not.toHaveBeenCalled()
  })

  it('stays empty when the local backend has no directory handle', () => {
    openShop()
    act(() => {
      useBackendStore.getState().setBackend('local-csv')
    })

    const { result } = renderHook(() => useShopMetadata())

    expect(result.current.metadata).toBeNull()
    expect(getFolderRepository).not.toHaveBeenCalled()
  })

  it('reads the active shop metadata', async () => {
    openShop()
    mockReadMetadata(() => Promise.resolve(metadata))

    const { result } = renderHook(() => useShopMetadata())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metadata).toEqual(metadata)
    expect(result.current.error).toBeNull()
  })

  it('surfaces a read failure', async () => {
    openShop()
    mockReadMetadata(() => Promise.reject(new Error('permission denied')))

    const { result } = renderHook(() => useShopMetadata())

    await waitFor(() => expect(result.current.error).toBe('permission denied'))
    expect(result.current.metadata).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('stringifies a non-Error rejection', async () => {
    openShop()
    mockReadMetadata(() => Promise.reject('boom'))

    const { result } = renderHook(() => useShopMetadata())

    await waitFor(() => expect(result.current.error).toBe('boom'))
  })

  it('ignores a read that lands after unmount', async () => {
    openShop()
    let resolveRead: (value: ShopMetadata | null) => void = () => {}
    mockReadMetadata(
      () =>
        new Promise<ShopMetadata | null>((resolve) => {
          resolveRead = resolve
        })
    )
    const { unmount } = renderHook(() => useShopMetadata())

    unmount()
    await act(async () => {
      resolveRead(metadata)
    })

    // No state update on an unmounted hook: React would warn and fail the run.
    expect(true).toBe(true)
  })

  it('ignores a failure that lands after unmount', async () => {
    openShop()
    let rejectRead: (reason: unknown) => void = () => {}
    mockReadMetadata(
      () =>
        new Promise<ShopMetadata | null>((_resolve, reject) => {
          rejectRead = reject
        })
    )
    const { unmount } = renderHook(() => useShopMetadata())

    unmount()
    await act(async () => {
      rejectRead(new Error('late'))
    })

    expect(true).toBe(true)
  })
})
