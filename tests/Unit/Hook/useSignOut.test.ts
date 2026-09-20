import { createElement, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { useSignOut } from '@/Hook/useSignOut'
import { initI18n } from '@/I18n'
import { persistDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

vi.mock('@/Repository/LocalCsv/persistDirectoryHandle', () => ({
  persistDirectoryHandle: vi.fn(async () => undefined),
}))

const i18n = initI18n('en')

function wrapper({ children }: { children: ReactNode }) {
  return createElement(I18nextProvider, { i18n }, children)
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

function signIn() {
  useAuthStore
    .getState()
    .login(
      { email: 'a@example.com', name: 'A', picture: '' },
      { accessToken: 'token', accessTokenExpiresAtMs: Date.now() + 3_600_000 }
    )
}

describe('useSignOut', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
  })

  it('signs out immediately when the workbook is clean', async () => {
    signIn()
    openShop()
    const { result } = renderHook(() => useSignOut(), { wrapper })

    await act(async () => {
      result.current.requestSignOut()
    })

    expect(result.current.needsConfirm).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useShopStore.getState().activeShop).toBeNull()
    expect(persistDirectoryHandle).toHaveBeenCalledWith(null)
  })

  it('waits for confirmation when a shop is open and the snapshot is dirty', () => {
    signIn()
    openShop()
    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })
    const { result } = renderHook(() => useSignOut(), { wrapper })

    act(() => {
      result.current.requestSignOut()
    })

    expect(result.current.needsConfirm).toBe(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('completes sign-out after confirm', async () => {
    signIn()
    openShop()
    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })
    const { result } = renderHook(() => useSignOut(), { wrapper })

    act(() => {
      result.current.requestSignOut()
    })

    await act(async () => {
      await result.current.confirmSignOut()
    })

    expect(result.current.needsConfirm).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useWorkbookStore.getState().dirty).toBe(false)
    expect(persistDirectoryHandle).toHaveBeenCalledWith(null)
  })

  it('keeps the session when sign-out is cancelled', () => {
    signIn()
    openShop()
    act(() => {
      useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
    })
    const { result } = renderHook(() => useSignOut(), { wrapper })

    act(() => {
      result.current.requestSignOut()
    })
    act(() => {
      result.current.cancelSignOut()
    })

    expect(result.current.needsConfirm).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useWorkbookStore.getState().dirty).toBe(true)
    expect(persistDirectoryHandle).not.toHaveBeenCalled()
  })
})
