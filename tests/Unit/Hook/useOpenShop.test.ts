import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { initI18n } from '@/I18n'
import { enterShop, toErrorMessage, useOpenShop } from '@/Hook/useOpenShop'
import { useShopStore } from '@/Store/shopStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

const { validateShopFolder, hydrate } = vi.hoisted(() => ({
  validateShopFolder: vi.fn(),
  hydrate: vi.fn(),
}))

vi.mock('@/Repository/RepositoryFactory', () => ({
  getFolderRepository: vi.fn(() => ({})),
  getWorkbookRepository: vi.fn(() => ({})),
}))

// `function`, not an arrow: the code under test calls these with `new`.
vi.mock('@/Service/ShopValidationService', () => ({
  ShopValidationService: vi.fn(function () {
    return { validateShopFolder }
  }),
}))

vi.mock('@/Service/WorkbookService', () => ({
  WorkbookService: vi.fn(function () {
    return { hydrate }
  }),
}))

const i18n = initI18n('en')

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(I18nextProvider, { i18n }, children)

const shop = {
  folderId: 'F1',
  folderName: 'illo3d',
  spreadsheetId: 'SS1',
  metadataVersion: '3.0.0',
}

describe('useOpenShop', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    hydrate.mockResolvedValue(undefined)
    useShopStore.setState({ activeShop: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hydrates then activates the shop when validation passes', async () => {
    validateShopFolder.mockResolvedValue({ ok: true, shop, metadata: {} })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({ ok: true, shop })
    expect(hydrate).toHaveBeenCalledTimes(1)
    expect(useShopStore.getState().activeShop).toEqual(shop)
  })

  it('surfaces a version mismatch as a migration candidate rather than an error', async () => {
    validateShopFolder.mockResolvedValue({
      ok: false,
      error: 'version',
      shopVersion: '2.0.0',
      appVersion: '3.0.0',
    })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'migration',
      candidate: { folderId: 'F1', shopVersion: '2.0.0', appVersion: '3.0.0' },
    })
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('rejects a shop from a newer app with the update message, not the wizard', async () => {
    validateShopFolder.mockResolvedValue({
      ok: false,
      error: 'version_ahead',
      shopVersion: '9.0.0',
      appVersion: '3.0.0',
    })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'error',
      message:
        'This shop was made by a newer version of this app. Update the app to open it.',
    })
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('rejects a shop whose version cannot be read, not the wizard', async () => {
    validateShopFolder.mockResolvedValue({
      ok: false,
      error: 'version_unreadable',
      shopVersion: 'garbage',
    })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'error',
      message: "This shop's version could not be read.",
    })
  })

  it('translates a not_shop rejection', async () => {
    validateShopFolder.mockResolvedValue({ ok: false, error: 'not_shop' })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'error',
      message: 'This folder is not an illo3d shop.',
    })
  })

  it('translates a structure rejection with its detail', async () => {
    validateShopFolder.mockResolvedValue({
      ok: false,
      error: 'structure',
      detail: "missing sheet 'jobs'",
    })
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toMatchObject({ ok: false, kind: 'error' })
    expect((outcome as { message: string }).message).toContain(
      "missing sheet 'jobs'"
    )
  })

  it('does not enter the app when hydration fails', async () => {
    validateShopFolder.mockResolvedValue({ ok: true, shop, metadata: {} })
    hydrate.mockRejectedValue(new Error('sheet unreachable'))
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let outcome: Awaited<ReturnType<typeof result.current.openShop>> | undefined
    await act(async () => {
      outcome = await result.current.openShop('F1')
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'error',
      message: 'sheet unreachable',
    })
    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('reports the opening flag while in flight and clears it after', async () => {
    let release: (() => void) | undefined
    validateShopFolder.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, shop, metadata: {} })
        })
    )
    const { result } = renderHook(() => useOpenShop(), { wrapper })

    let pending: Promise<unknown> | undefined
    act(() => {
      pending = result.current.openShop('F1')
    })
    await waitFor(() => expect(result.current.opening).toBe(true))

    await act(async () => {
      release?.()
      await pending
    })
    expect(result.current.opening).toBe(false)
  })
})

describe('enterShop', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.clearAllMocks()
    hydrate.mockResolvedValue(undefined)
    useShopStore.setState({ activeShop: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('publishes the shop only after hydration resolves', async () => {
    let hydrated = false
    hydrate.mockImplementation(async () => {
      expect(useShopStore.getState().activeShop).toBeNull()
      hydrated = true
    })

    await enterShop(shop)

    expect(hydrated).toBe(true)
    expect(useShopStore.getState().activeShop).toEqual(shop)
  })
})

describe('toErrorMessage', () => {
  it('uses an Error message verbatim', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('stringifies non-Errors', () => {
    expect(toErrorMessage('plain')).toBe('plain')
    expect(toErrorMessage(42)).toBe('42')
  })
})
