import { renderHook, act, waitFor } from '@testing-library/react'
import { useLocalFolderReopenGate } from '@/Hook/useLocalFolderReopenGate'
import * as directoryPermission from '@/Repository/LocalCsv/directoryPermission'
import { persistDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'
import { createFakeDirectory } from '../Repository/LocalCsv/fakeDirectoryHandle'

vi.mock('@/Repository/LocalCsv/persistDirectoryHandle', () => ({
  persistDirectoryHandle: vi.fn(async () => undefined),
}))

function openLocalShop(handle: FileSystemDirectoryHandle) {
  useAuthStore.getState().loginAsLocalUser()
  useBackendStore.getState().setBackend('local-csv')
  useBackendStore.getState().setLocalDirectoryHandle(handle)
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

describe('useLocalFolderReopenGate', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
    useAuthStore.getState().logout()
  })

  it('stays idle without a local CSV shop', () => {
    const { result } = renderHook(() => useLocalFolderReopenGate())
    expect(result.current.phase).toBe('idle')
  })

  it('becomes ready when permission is already granted', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'granted')
    openLocalShop(handle)

    const { result } = renderHook(() => useLocalFolderReopenGate())

    await waitFor(() => expect(result.current.phase).toBe('ready'))
  })

  it('needs re-allow when permission is prompt', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'prompt')
    openLocalShop(handle)

    const { result } = renderHook(() => useLocalFolderReopenGate())

    await waitFor(() => expect(result.current.phase).toBe('needs-reallow'))
  })

  it('needs re-allow when permission query fails', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'granted')
    openLocalShop(handle)
    vi.spyOn(directoryPermission, 'queryDirectoryPermission').mockRejectedValue(
      new Error('permission probe failed')
    )

    const { result } = renderHook(() => useLocalFolderReopenGate())

    await waitFor(() => expect(result.current.phase).toBe('needs-reallow'))
  })

  it('grantAccess moves to ready after permission is granted', async () => {
    const fake = createFakeDirectory('shop', {}, 'prompt')
    openLocalShop(fake.handle)

    const { result } = renderHook(() => useLocalFolderReopenGate())
    await waitFor(() => expect(result.current.phase).toBe('needs-reallow'))

    await act(async () => {
      await result.current.grantAccess()
    })

    expect(result.current.phase).toBe('ready')
  })

  it('decline clears shop state and persisted handle', async () => {
    const { handle } = createFakeDirectory('shop', {}, 'prompt')
    openLocalShop(handle)

    const { result } = renderHook(() => useLocalFolderReopenGate())
    await waitFor(() => expect(result.current.phase).toBe('needs-reallow'))

    await act(async () => {
      await result.current.decline()
    })

    expect(result.current.phase).toBe('idle')
    expect(useShopStore.getState().activeShop).toBeNull()
    expect(useBackendStore.getState().backend).toBeNull()
    expect(persistDirectoryHandle).toHaveBeenCalledWith(null)
  })
})
