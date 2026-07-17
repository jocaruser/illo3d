import { act, renderHook, waitFor } from '@testing-library/react'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { useShopLogoUrl } from '@/Hook/useShopLogoUrl'
import { driveFetch } from '@/Repository/GSheet/GoogleApiClient'
import { getFolderRepository } from '@/Repository/RepositoryFactory'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { createFakeDirectory } from '../Repository/LocalCsv/fakeDirectoryHandle'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(),
  getWorkbookRepository: vi.fn(),
}))

vi.mock('@/Repository/GSheet/GoogleApiClient', () => ({
  driveFetch: vi.fn(),
}))

function baseMetadata(logo?: string): ShopMetadata {
  return {
    app: 'illo3d',
    version: '3.0.0',
    spreadsheetId: 'sheet-1',
    createdAt: '2026-01-01',
    createdBy: 'someone@example.com',
    ...(logo === undefined ? {} : { logo }),
  }
}

function mockMetadata(metadata: ShopMetadata | null) {
  vi.mocked(getFolderRepository).mockReturnValue({
    readMetadata: vi.fn(() => Promise.resolve(metadata)),
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
}

function driveResponse(payload: unknown): Response {
  return { json: () => Promise.resolve(payload) } as Response
}

describe('useShopLogoUrl', () => {
  const createObjectURL = vi.fn(() => 'blob:logo-url')
  const revokeObjectURL = vi.fn()
  // Patch the methods rather than the global: `new URL()` must keep working.
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL

  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    URL.createObjectURL =
      createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  })

  it('is null with no shop open', () => {
    mockMetadata(null)

    const { result } = renderHook(() => useShopLogoUrl())

    expect(result.current).toBeNull()
  })

  it('is null when the shop metadata declares no logo', async () => {
    openShop()
    useBackendStore.getState().setBackend('google-drive')
    mockMetadata(baseMetadata())

    const { result } = renderHook(() => useShopLogoUrl())

    await waitFor(() => expect(getFolderRepository).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  it('is null when the logo name is blank', async () => {
    openShop()
    useBackendStore.getState().setBackend('google-drive')
    mockMetadata(baseMetadata(''))

    const { result } = renderHook(() => useShopLogoUrl())

    await waitFor(() => expect(getFolderRepository).toHaveBeenCalled())
    expect(result.current).toBeNull()
  })

  describe('local backend', () => {
    beforeEach(() => {
      openShop()
      const { handle } = createFakeDirectory('shop', { 'logo.png': 'binary' })
      useBackendStore.getState().setBackend('local-csv')
      useBackendStore.getState().setLocalDirectoryHandle(handle)
      mockMetadata(baseMetadata('logo.png'))
    })

    it('reads the file through the handle as an object URL', async () => {
      const { result } = renderHook(() => useShopLogoUrl())

      await waitFor(() => expect(result.current).toBe('blob:logo-url'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)
    })

    it('revokes the object URL on unmount', async () => {
      const { result, unmount } = renderHook(() => useShopLogoUrl())
      await waitFor(() => expect(result.current).toBe('blob:logo-url'))

      unmount()

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:logo-url')
    })

    it('is null when the logo file is missing', async () => {
      mockMetadata(baseMetadata('absent.png'))

      const { result } = renderHook(() => useShopLogoUrl())

      await waitFor(() => expect(getFolderRepository).toHaveBeenCalled())
      expect(result.current).toBeNull()
    })
  })

  describe('Drive backend', () => {
    beforeEach(() => {
      openShop()
      useBackendStore.getState().setBackend('google-drive')
      mockMetadata(baseMetadata('logo.png'))
    })

    it('prefers the thumbnail link', async () => {
      vi.mocked(driveFetch).mockResolvedValue(
        driveResponse({
          files: [{ id: 'file-1', thumbnailLink: 'https://lh3.example/thumb' }],
        })
      )

      const { result } = renderHook(() => useShopLogoUrl())

      await waitFor(() =>
        expect(result.current).toBe('https://lh3.example/thumb')
      )
      expect(revokeObjectURL).not.toHaveBeenCalled()
    })

    it('falls back to the plain file URL', async () => {
      vi.mocked(driveFetch).mockResolvedValue(
        driveResponse({ files: [{ id: 'file-1' }] })
      )

      const { result } = renderHook(() => useShopLogoUrl())

      await waitFor(() =>
        expect(result.current).toBe(
          'https://drive.google.com/uc?export=view&id=file-1'
        )
      )
    })

    it('is null when the folder holds no such file', async () => {
      vi.mocked(driveFetch).mockResolvedValue(driveResponse({}))

      const { result } = renderHook(() => useShopLogoUrl())

      await waitFor(() => expect(driveFetch).toHaveBeenCalled())
      expect(result.current).toBeNull()
    })
  })

  it('drops the logo when the backend stops being able to serve it', async () => {
    openShop()
    const { handle } = createFakeDirectory('shop', { 'logo.png': 'binary' })
    useBackendStore.getState().setBackend('local-csv')
    useBackendStore.getState().setLocalDirectoryHandle(handle)
    mockMetadata(baseMetadata('logo.png'))
    const { result } = renderHook(() => useShopLogoUrl())
    await waitFor(() => expect(result.current).toBe('blob:logo-url'))

    // Losing the handle leaves a logo name no backend can resolve.
    act(() => {
      useBackendStore.getState().setLocalDirectoryHandle(null)
    })

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('revokes an object URL that only resolves after unmount', async () => {
    openShop()
    let releaseFile: () => void = () => {}
    const getFileHandle = vi.fn(
      () =>
        new Promise((resolve) => {
          releaseFile = () =>
            resolve({ getFile: () => Promise.resolve({ name: 'logo.png' }) })
        })
    )
    useBackendStore.getState().setBackend('local-csv')
    useBackendStore
      .getState()
      .setLocalDirectoryHandle({
        getFileHandle,
      } as unknown as FileSystemDirectoryHandle)
    mockMetadata(baseMetadata('logo.png'))
    const { unmount } = renderHook(() => useShopLogoUrl())
    await waitFor(() => expect(getFileHandle).toHaveBeenCalled())

    unmount()
    await act(async () => {
      releaseFile()
      await Promise.resolve()
    })

    // The URL was minted for a hook that no longer exists — it must not leak.
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:logo-url')
    )
  })

  it('has nothing to revoke when a Drive link resolves after unmount', async () => {
    openShop()
    useBackendStore.getState().setBackend('google-drive')
    mockMetadata(baseMetadata('logo.png'))
    let releaseFetch: () => void = () => {}
    vi.mocked(driveFetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        releaseFetch = () =>
          resolve(
            driveResponse({
              files: [{ id: 'file-1', thumbnailLink: 'https://lh3/t' }],
            })
          )
      })
    )
    const { unmount } = renderHook(() => useShopLogoUrl())
    await waitFor(() => expect(driveFetch).toHaveBeenCalled())

    unmount()
    await act(async () => {
      releaseFetch()
      await Promise.resolve()
    })

    // A Drive link is not an object URL: revoking it would be meaningless.
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it('swallows a read that fails after unmount', async () => {
    openShop()
    let failFile: () => void = () => {}
    const getFileHandle = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          failFile = () => reject(new Error('permission revoked'))
        })
    )
    useBackendStore.getState().setBackend('local-csv')
    useBackendStore
      .getState()
      .setLocalDirectoryHandle({
        getFileHandle,
      } as unknown as FileSystemDirectoryHandle)
    mockMetadata(baseMetadata('logo.png'))
    const { unmount } = renderHook(() => useShopLogoUrl())
    await waitFor(() => expect(getFileHandle).toHaveBeenCalled())

    unmount()

    // No state update on an unmounted hook: React would warn and fail the run.
    await act(async () => {
      failFile()
      await Promise.resolve()
    })
  })
})
