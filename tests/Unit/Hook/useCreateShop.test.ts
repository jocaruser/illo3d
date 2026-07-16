import { act, renderHook, waitFor } from '@testing-library/react'
import { SHOP_NAME, useCreateShop } from '@/Hook/useCreateShop'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

const {
  createShopMock,
  createFolder,
  moveFileToFolder,
  createWorkbook,
  hydrate,
  ShopProvisioningService,
  GSheetWorkbookRepository,
  GDriveFolderRepository,
  LocalCsvFolderRepository,
  LocalCsvWorkbookRepository,
} = vi.hoisted(() => {
  const createWorkbookInner = vi.fn(async () => 'SS-GOOGLE')
  return {
    createShopMock: vi.fn(),
    createFolder: vi.fn(async () => 'FOLDER-1'),
    moveFileToFolder: vi.fn(async () => undefined),
    createWorkbook: createWorkbookInner,
    hydrate: vi.fn(async () => undefined),
    ShopProvisioningService: vi.fn(function () {
      return { createShop: createShopMock }
    }),
    // A real class: `useCreateShop` extends it to reparent the new spreadsheet.
    // `createWorkbook` must live on the prototype (as it does in the real
    // repository) or the subclass's override cannot shadow it.
    GSheetWorkbookRepository: class {
      async createWorkbook(): Promise<string> {
        return createWorkbookInner()
      }
    },
    GDriveFolderRepository: vi.fn(function () {
      return { kind: 'gdrive-folder' }
    }),
    LocalCsvFolderRepository: vi.fn(function () {
      return { kind: 'local-folder' }
    }),
    LocalCsvWorkbookRepository: vi.fn(function () {
      return { kind: 'local-workbook' }
    }),
  }
})

vi.mock('@/Repository/GSheet/DriveFiles', () => ({
  createFolder,
  moveFileToFolder,
}))
vi.mock('@/Repository/GSheet/GDriveFolderRepository', () => ({
  GDriveFolderRepository,
}))
vi.mock('@/Repository/GSheet/GSheetWorkbookRepository', () => ({
  GSheetWorkbookRepository,
}))
vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', () => ({
  LocalCsvFolderRepository,
}))
vi.mock('@/Repository/LocalCsv/LocalCsvWorkbookRepository', () => ({
  LocalCsvWorkbookRepository,
}))
vi.mock('@/Service/ShopProvisioningService', () => ({
  ShopProvisioningService,
}))
vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(() => ({})),
  getWorkbookRepository: vi.fn(() => ({})),
}))
vi.mock('@/Service/WorkbookService', () => ({
  WorkbookService: vi.fn(function () {
    return { hydrate }
  }),
}))

const clock = { now: () => new Date('2026-07-16T10:00:00.000Z') }

const handle = { name: 'my-shop' } as unknown as FileSystemDirectoryHandle

const localShop = {
  folderId: 'my-shop',
  folderName: 'my-shop',
  spreadsheetId: 'local-my-shop',
  metadataVersion: '3.0.0',
}

describe('useCreateShop', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    hydrate.mockResolvedValue(undefined)
    createShopMock.mockResolvedValue(localShop)
    useShopStore.setState({ activeShop: null })
    useAuthStore.setState({ user: null })
    useBackendStore.setState({ backend: null, localDirectoryHandle: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('provisions a local shop from the directory handle and enters it', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    useAuthStore.setState({ user: { email: '', name: 'Local user' } })
    const { result } = renderHook(() => useCreateShop(clock))

    let outcome:
      Awaited<ReturnType<typeof result.current.createShop>> | undefined
    await act(async () => {
      outcome = await result.current.createShop()
    })

    expect(LocalCsvFolderRepository).toHaveBeenCalledWith(handle)
    expect(LocalCsvWorkbookRepository).toHaveBeenCalledWith(handle)
    expect(ShopProvisioningService).toHaveBeenCalledWith(
      { kind: 'local-folder' },
      { kind: 'local-workbook' },
      clock,
      'my-shop',
      'my-shop'
    )
    // A local user has no email — the audit actor falls back to 'local'.
    expect(createShopMock).toHaveBeenCalledWith('local')
    expect(outcome).toEqual({ ok: true, shop: localShop })
    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(useShopStore.getState().activeShop).toEqual(localShop)
  })

  it("falls back to 'local' as the actor when nobody is signed in", async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    const { result } = renderHook(() => useCreateShop(clock))

    await act(async () => {
      await result.current.createShop()
    })

    expect(createShopMock).toHaveBeenCalledWith('local')
  })

  it("uses the signed-in user's email as the actor", async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    useAuthStore.setState({
      user: { email: 'carlos@example.com', name: 'Carlos' },
    })
    const { result } = renderHook(() => useCreateShop(clock))

    await act(async () => {
      await result.current.createShop()
    })

    expect(createShopMock).toHaveBeenCalledWith('carlos@example.com')
  })

  it('creates the Drive folder before provisioning the Google shop', async () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    useAuthStore.setState({
      user: { email: 'carlos@example.com', name: 'Carlos' },
    })
    const { result } = renderHook(() => useCreateShop(clock))

    await act(async () => {
      await result.current.createShop()
    })

    expect(createFolder).toHaveBeenCalledWith(SHOP_NAME)
    const [folderRepo, , injectedClock, folderId, folderName] =
      ShopProvisioningService.mock.calls[0] as unknown[]
    expect(folderRepo).toEqual({ kind: 'gdrive-folder' })
    expect(injectedClock).toBe(clock)
    expect(folderId).toBe('FOLDER-1')
    expect(folderName).toBe(SHOP_NAME)
  })

  it('reparents the new spreadsheet into the shop folder as part of creating it', async () => {
    useBackendStore.setState({
      backend: 'google-drive',
      localDirectoryHandle: null,
    })
    const { result } = renderHook(() => useCreateShop(clock))

    await act(async () => {
      await result.current.createShop()
    })

    const workbookRepo = ShopProvisioningService.mock.calls[0][1] as {
      createWorkbook: () => Promise<string>
    }
    await expect(workbookRepo.createWorkbook()).resolves.toBe('SS-GOOGLE')
    expect(createWorkbook).toHaveBeenCalled()
    expect(moveFileToFolder).toHaveBeenCalledWith('SS-GOOGLE', 'FOLDER-1')
  })

  it('rejects when no backend is selected', async () => {
    const { result } = renderHook(() => useCreateShop(clock))

    let outcome:
      Awaited<ReturnType<typeof result.current.createShop>> | undefined
    await act(async () => {
      outcome = await result.current.createShop()
    })

    expect(outcome).toEqual({ ok: false, message: 'No backend selected' })
  })

  it('rejects when the local backend has no directory handle', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: null,
    })
    const { result } = renderHook(() => useCreateShop(clock))

    let outcome:
      Awaited<ReturnType<typeof result.current.createShop>> | undefined
    await act(async () => {
      outcome = await result.current.createShop()
    })

    expect(outcome).toEqual({ ok: false, message: 'No backend selected' })
  })

  it('reports a provisioning failure without entering the app', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    createShopMock.mockRejectedValue(new Error('quota exceeded'))
    const { result } = renderHook(() => useCreateShop(clock))

    let outcome:
      Awaited<ReturnType<typeof result.current.createShop>> | undefined
    await act(async () => {
      outcome = await result.current.createShop()
    })

    expect(outcome).toEqual({ ok: false, message: 'quota exceeded' })
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('defaults to a system clock when none is injected', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    const { result } = renderHook(() => useCreateShop())

    await act(async () => {
      await result.current.createShop()
    })

    const injectedClock = ShopProvisioningService.mock.calls[0][2] as {
      now: () => Date
    }
    expect(injectedClock.now()).toBeInstanceOf(Date)
  })

  it('reports the creating flag while in flight and clears it after', async () => {
    useBackendStore.setState({
      backend: 'local-csv',
      localDirectoryHandle: handle,
    })
    let release: (() => void) | undefined
    createShopMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(localShop)
        })
    )
    const { result } = renderHook(() => useCreateShop(clock))

    let pending: Promise<unknown> | undefined
    act(() => {
      pending = result.current.createShop()
    })
    await waitFor(() => expect(result.current.creating).toBe(true))

    await act(async () => {
      release?.()
      await pending
    })
    expect(result.current.creating).toBe(false)
  })
})
