import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { toast } from '@/Component/Toast'
import { useWorkbookService } from '@/Hook/useWorkbookService'
import { initI18n } from '@/I18n'
import { GoogleSessionError } from '@/Security/GoogleSession'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

const mocks = vi.hoisted(() => ({
  hydrate: vi.fn<() => Promise<void>>(),
  save: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/Service/WorkbookService', () => ({
  WorkbookService: class {
    hydrate = mocks.hydrate
    save = mocks.save
  },
}))

vi.mock('@/Repository/RepositoryFactory', () => ({
  getWorkbookRepository: vi.fn(() => ({})),
  getFolderRepository: vi.fn(() => ({})),
}))

vi.mock('@/Component/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

const i18n = initI18n('en')

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
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

function render() {
  return renderHook(() => useWorkbookService(), { wrapper })
}

describe('useWorkbookService', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    mocks.hydrate.mockResolvedValue()
    mocks.save.mockResolvedValue()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('without a usable backend', () => {
    it('is not ready and does nothing when no shop is open', async () => {
      const { result } = render()

      expect(result.current.ready).toBe(false)

      await act(() => result.current.save())
      await act(() => result.current.hydrate())

      expect(mocks.save).not.toHaveBeenCalled()
      expect(mocks.hydrate).not.toHaveBeenCalled()
    })

    it('is not ready when the local backend has no directory handle', () => {
      openShop()
      act(() => {
        useBackendStore.getState().setBackend('local-csv')
      })

      const { result } = render()

      expect(result.current.ready).toBe(false)
    })
  })

  describe('ready', () => {
    it('is true only for an idle, hydrated workbook', () => {
      openShop()
      const { result, rerender } = render()

      expect(result.current.ready).toBe(false)

      act(() => {
        useWorkbookStore.getState().setStatus('ready')
      })
      rerender()
      expect(result.current.ready).toBe(true)

      act(() => {
        useWorkbookStore.getState().beginSave()
      })
      rerender()
      expect(result.current.ready).toBe(false)
    })
  })

  describe('save', () => {
    it('toasts success', async () => {
      openShop()
      const { result } = render()

      await act(() => result.current.save())

      expect(mocks.save).toHaveBeenCalledTimes(1)
      expect(toast.success).toHaveBeenCalledWith('Workbook saved.')
    })

    it('offers a retry that saves again', async () => {
      openShop()
      mocks.save.mockRejectedValueOnce(new Error('offline'))
      const { result } = render()

      await act(() => result.current.save())

      expect(toast.error).toHaveBeenCalledWith('Could not save workbook.', expect.anything())
      const options = vi.mocked(toast.error).mock.calls[0][1]
      expect(options?.action?.label).toBe('Retry')

      mocks.save.mockResolvedValueOnce()
      await act(async () => {
        options?.action?.onClick()
      })
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2))
    })

    it('reports an expired Google session instead of a retry', async () => {
      openShop()
      mocks.save.mockRejectedValueOnce(new GoogleSessionError('expired'))
      const { result } = render()

      await act(() => result.current.save())

      expect(toast.error).toHaveBeenCalledWith(
        'Your Google session expired. Try signing in with Google again, then retry.'
      )
    })
  })

  describe('hydrate', () => {
    it('reads the workbook', async () => {
      openShop()
      const { result } = render()

      await act(() => result.current.hydrate())

      expect(mocks.hydrate).toHaveBeenCalledTimes(1)
    })

    it('offers a retry that hydrates again', async () => {
      openShop()
      mocks.hydrate.mockRejectedValueOnce(new Error('offline'))
      const { result } = render()

      await act(() => result.current.hydrate())

      expect(toast.error).toHaveBeenCalledWith('Could not load', expect.anything())
      const options = vi.mocked(toast.error).mock.calls[0][1]
      mocks.hydrate.mockResolvedValueOnce()
      await act(async () => {
        options?.action?.onClick()
      })
      await waitFor(() => expect(mocks.hydrate).toHaveBeenCalledTimes(2))
    })

    it('reports an expired Google session', async () => {
      openShop()
      mocks.hydrate.mockRejectedValueOnce(new GoogleSessionError('expired'))
      const { result } = render()

      await act(() => result.current.hydrate())

      expect(toast.error).toHaveBeenCalledWith(
        'Your Google session expired. Try signing in with Google again, then retry.'
      )
    })
  })

  describe('refresh', () => {
    it('re-reads immediately when the snapshot is clean', async () => {
      openShop()
      const { result } = render()

      await act(() => result.current.refresh())

      expect(result.current.needsConfirm).toBe(false)
      expect(mocks.hydrate).toHaveBeenCalledTimes(1)
    })

    it('asks first when the snapshot is dirty, then re-reads on confirm', async () => {
      openShop()
      const { result, rerender } = render()
      act(() => {
        useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
      })
      rerender()

      await act(() => result.current.refresh())

      expect(result.current.needsConfirm).toBe(true)
      expect(mocks.hydrate).not.toHaveBeenCalled()

      await act(() => result.current.confirmRefresh())

      expect(result.current.needsConfirm).toBe(false)
      expect(mocks.hydrate).toHaveBeenCalledTimes(1)
    })

    it('drops the prompt on cancel without re-reading', async () => {
      openShop()
      const { result, rerender } = render()
      act(() => {
        useWorkbookStore.getState().mutateTab('clients', (matrix) => matrix)
      })
      rerender()
      await act(() => result.current.refresh())

      act(() => {
        result.current.cancelRefresh()
      })

      expect(result.current.needsConfirm).toBe(false)
      expect(mocks.hydrate).not.toHaveBeenCalled()
    })
  })
})
