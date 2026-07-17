import { installFakeLocalStorage } from './memoryLocalStorage'

async function freshPreferencesStore() {
  vi.resetModules()
  const { useUserPreferencesStore } = await import('@/Store/userPreferencesStore')
  return useUserPreferencesStore
}

describe('useUserPreferencesStore', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to English and light theme', async () => {
    const useUserPreferencesStore = await freshPreferencesStore()

    expect(useUserPreferencesStore.getState()).toMatchObject({
      language: 'en',
      theme: 'light',
    })
  })

  it('setLanguage persists the language', async () => {
    const useUserPreferencesStore = await freshPreferencesStore()

    useUserPreferencesStore.getState().setLanguage('es')

    expect(useUserPreferencesStore.getState().language).toBe('es')
  })

  it('setTheme persists the theme', async () => {
    const useUserPreferencesStore = await freshPreferencesStore()

    useUserPreferencesStore.getState().setTheme('dark')

    expect(useUserPreferencesStore.getState().theme).toBe('dark')
  })

  it('writes the exact key and shape that readPersistedLanguage expects', async () => {
    // src/I18n/index.ts reads `user-preferences-storage` and expects the
    // zustand persist envelope { state: { language } } before React mounts.
    const useUserPreferencesStore = await freshPreferencesStore()

    useUserPreferencesStore.getState().setLanguage('es')
    useUserPreferencesStore.getState().setTheme('dark')

    const raw = localStorage.getItem('user-preferences-storage')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string) as { state: Record<string, unknown> }
    expect(parsed.state).toEqual({ language: 'es', theme: 'dark' })
  })

  it('rehydrates preferences from storage', async () => {
    localStorage.setItem(
      'user-preferences-storage',
      JSON.stringify({ state: { language: 'es', theme: 'dark' }, version: 0 })
    )

    const useUserPreferencesStore = await freshPreferencesStore()

    expect(useUserPreferencesStore.getState()).toMatchObject({
      language: 'es',
      theme: 'dark',
    })
  })
})
