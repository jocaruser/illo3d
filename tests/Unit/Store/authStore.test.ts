import type { AuthUser, GoogleCredentials } from '@/Store/authStore'
import { installFakeLocalStorage } from './memoryLocalStorage'

const googleUser: AuthUser = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  picture: 'https://example.com/ada.png',
}

const credentials: GoogleCredentials = {
  accessToken: 'secret-access-token',
  accessTokenExpiresAtMs: 1_800_000_000_000,
}

async function freshAuthStore() {
  vi.resetModules()
  const { useAuthStore } = await import('@/Store/authStore')
  return useAuthStore
}

function persistedState(): Record<string, unknown> {
  const raw = localStorage.getItem('auth-storage')
  expect(raw).not.toBeNull()
  return (JSON.parse(raw as string) as { state: Record<string, unknown> }).state
}

describe('useAuthStore', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts signed out', async () => {
    const useAuthStore = await freshAuthStore()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      accessTokenExpiresAtMs: null,
      googleSessionNeedsReauth: false,
    })
  })

  it('login stores the user and credentials in memory', async () => {
    const useAuthStore = await freshAuthStore()

    useAuthStore.getState().login(googleUser, credentials)

    expect(useAuthStore.getState()).toMatchObject({
      user: googleUser,
      isAuthenticated: true,
      accessToken: 'secret-access-token',
      accessTokenExpiresAtMs: 1_800_000_000_000,
      googleSessionNeedsReauth: false,
    })
  })

  it('never persists the access token — only user and isAuthenticated land in storage', async () => {
    const useAuthStore = await freshAuthStore()

    useAuthStore.getState().login(googleUser, credentials)

    const state = persistedState()
    expect(state).toEqual({ user: googleUser, isAuthenticated: true })
    expect(Object.keys(state).sort()).toEqual(['isAuthenticated', 'user'])
    expect(localStorage.getItem('auth-storage')).not.toContain('secret-access-token')
  })

  it('login clears a pending reauth flag', async () => {
    const useAuthStore = await freshAuthStore()
    useAuthStore.getState().markGoogleSessionNeedsReauth()

    useAuthStore.getState().login(googleUser, credentials)

    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(false)
  })

  it('loginAsLocalUser signs in a synthetic user without credentials', async () => {
    const useAuthStore = await freshAuthStore()

    useAuthStore.getState().loginAsLocalUser()

    expect(useAuthStore.getState()).toMatchObject({
      user: { email: '', name: 'Local user' },
      isAuthenticated: true,
      accessToken: null,
      accessTokenExpiresAtMs: null,
    })
    expect(persistedState()).toEqual({
      user: { email: '', name: 'Local user' },
      isAuthenticated: true,
    })
  })

  it('patchGoogleCredentials replaces the token and clears the reauth flag, in memory only', async () => {
    const useAuthStore = await freshAuthStore()
    useAuthStore.getState().login(googleUser, credentials)
    useAuthStore.getState().markGoogleSessionNeedsReauth()

    useAuthStore.getState().patchGoogleCredentials({
      accessToken: 'renewed-token',
      accessTokenExpiresAtMs: 1_800_000_360_000,
    })

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'renewed-token',
      accessTokenExpiresAtMs: 1_800_000_360_000,
      googleSessionNeedsReauth: false,
    })
    expect(localStorage.getItem('auth-storage')).not.toContain('renewed-token')
  })

  it('marks and clears googleSessionNeedsReauth without touching storage', async () => {
    const useAuthStore = await freshAuthStore()
    useAuthStore.getState().login(googleUser, credentials)

    useAuthStore.getState().markGoogleSessionNeedsReauth()
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
    expect(persistedState()).toEqual({ user: googleUser, isAuthenticated: true })

    useAuthStore.getState().clearGoogleSessionNeedsReauth()
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(false)
  })

  it('logout clears everything, including persisted identity', async () => {
    const useAuthStore = await freshAuthStore()
    useAuthStore.getState().login(googleUser, credentials)
    useAuthStore.getState().markGoogleSessionNeedsReauth()

    useAuthStore.getState().logout()

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      accessTokenExpiresAtMs: null,
      googleSessionNeedsReauth: false,
    })
    expect(persistedState()).toEqual({ user: null, isAuthenticated: false })
  })

  it('rehydrates identity from storage but never a token', async () => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { user: googleUser, isAuthenticated: true }, version: 0 })
    )

    const useAuthStore = await freshAuthStore()

    expect(useAuthStore.getState()).toMatchObject({
      user: googleUser,
      isAuthenticated: true,
      accessToken: null,
      accessTokenExpiresAtMs: null,
      googleSessionNeedsReauth: false,
    })
  })
})
