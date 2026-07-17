import { render } from '@testing-library/react'
import { WorkbookBootstrap } from '@/Component/layout/WorkbookBootstrap'
import {
  useWorkbookService,
  type UseWorkbookService,
} from '@/Hook/useWorkbookService'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { installFakeLocalStorage } from '../../Store/memoryLocalStorage'

vi.mock('@/Hook/useWorkbookService', () => ({ useWorkbookService: vi.fn() }))

const hydrate = vi.fn().mockResolvedValue(undefined)

function mockService() {
  vi.mocked(useWorkbookService).mockReturnValue({
    hydrate,
  } as unknown as UseWorkbookService)
}

function openShop() {
  useShopStore.getState().setActiveShop({
    folderId: 'folder-1',
    folderName: 'Shop',
    spreadsheetId: 'sheet-1',
    metadataVersion: '3.0.0',
  })
}

function stubGoogleIdentity() {
  vi.stubGlobal('google', {
    accounts: { oauth2: { initTokenClient: vi.fn() } },
  })
}

describe('WorkbookBootstrap', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    mockService()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('hydrates when a persisted shop wakes up with an idle workbook', () => {
    openShop()
    useBackendStore.getState().setBackend('local-csv')

    render(<WorkbookBootstrap />)

    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('does nothing without an active shop', () => {
    render(<WorkbookBootstrap />)

    expect(hydrate).not.toHaveBeenCalled()
  })

  it('does nothing when the workbook is already past idle', () => {
    openShop()
    useWorkbookStore.getState().setStatus('loading')

    render(<WorkbookBootstrap />)

    expect(hydrate).not.toHaveBeenCalled()
  })

  it('leaves a failed hydration for the user to retry', () => {
    openShop()
    useWorkbookStore.getState().setStatus('error', 'boom')

    render(<WorkbookBootstrap />)

    expect(hydrate).not.toHaveBeenCalled()
  })

  it('hydrates a Drive shop immediately when GIS is already loaded', () => {
    stubGoogleIdentity()
    openShop()
    useBackendStore.getState().setBackend('google-drive')

    render(<WorkbookBootstrap />)

    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('waits for the GIS script before hydrating a Drive shop', () => {
    vi.useFakeTimers()
    openShop()
    useBackendStore.getState().setBackend('google-drive')

    render(<WorkbookBootstrap />)
    expect(hydrate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(hydrate).not.toHaveBeenCalled()

    stubGoogleIdentity()
    vi.advanceTimersByTime(100)
    expect(hydrate).toHaveBeenCalledTimes(1)

    // The interval is cleared: no second hydration on later ticks.
    vi.advanceTimersByTime(1000)
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('hydrates anyway when GIS never loads, so the real error surfaces', () => {
    vi.useFakeTimers()
    openShop()
    useBackendStore.getState().setBackend('google-drive')

    render(<WorkbookBootstrap />)

    vi.advanceTimersByTime(6000)
    expect(hydrate).toHaveBeenCalledTimes(1)
  })

  it('stops waiting for GIS when unmounted', () => {
    vi.useFakeTimers()
    openShop()
    useBackendStore.getState().setBackend('google-drive')

    const { unmount } = render(<WorkbookBootstrap />)
    unmount()

    stubGoogleIdentity()
    vi.advanceTimersByTime(6000)
    expect(hydrate).not.toHaveBeenCalled()
  })

  it('renders nothing', () => {
    const { container } = render(<WorkbookBootstrap />)

    expect(container).toBeEmptyDOMElement()
  })
})
