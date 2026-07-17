import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

async function loadModules() {
  vi.resetModules()
  const { useAuthStore } = await import('@/Store/authStore')
  const { useBackendStore } = await import('@/Store/backendStore')
  const login = await import('@/Security/googleLogin')
  return { useAuthStore, useBackendStore, login }
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()
  fetchMock.mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('fetchGoogleUserInfo', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the userinfo payload to an AuthUser', async () => {
    const { login } = await loadModules()
    const fetchMock = stubFetch(
      jsonResponse({
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        picture: 'https://example.com/ada.png',
        sub: 'ignored-claim',
      })
    )

    const user = await login.fetchGoogleUserInfo('user-token')

    expect(user).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      picture: 'https://example.com/ada.png',
    })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: 'Bearer user-token' } }
    )
  })

  it('leaves picture undefined when Google returns none', async () => {
    const { login } = await loadModules()
    stubFetch(jsonResponse({ email: 'ada@example.com', name: 'Ada Lovelace' }))

    const user = await login.fetchGoogleUserInfo('user-token')

    expect(user.picture).toBeUndefined()
  })

  it('throws on a non-2xx response', async () => {
    const { login } = await loadModules()
    stubFetch(new Response(null, { status: 403 }))

    await expect(login.fetchGoogleUserInfo('user-token')).rejects.toThrow(
      'Failed to fetch Google user info (HTTP 403)'
    )
  })
})

describe('completeGoogleLogin', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('logs the user in with absolute expiry and selects the Google Drive backend', async () => {
    const { useAuthStore, useBackendStore, login } = await loadModules()
    stubFetch(
      jsonResponse({
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        picture: 'https://example.com/ada.png',
      })
    )
    const before = Date.now()

    await login.completeGoogleLogin({ access_token: 'wizard-token', expires_in: 3599 })

    const state = useAuthStore.getState()
    expect(state.user).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      picture: 'https://example.com/ada.png',
    })
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('wizard-token')
    expect(state.accessTokenExpiresAtMs).toBeGreaterThanOrEqual(before + 3_599_000)
    expect(state.accessTokenExpiresAtMs).toBeLessThanOrEqual(Date.now() + 3_599_000)
    expect(useBackendStore.getState().backend).toBe('google-drive')

    // Persistence contract: identity and backend land in storage, the token never does.
    expect(localStorage.getItem('auth-storage')).not.toContain('wizard-token')
    const backendRaw = localStorage.getItem('backend-storage')
    expect(backendRaw).not.toBeNull()
    expect(JSON.parse(backendRaw as string).state).toEqual({ backend: 'google-drive' })
  })

  it('does not log in nor select a backend when userinfo fails', async () => {
    const { useAuthStore, useBackendStore, login } = await loadModules()
    stubFetch(new Response(null, { status: 500 }))

    await expect(
      login.completeGoogleLogin({ access_token: 'wizard-token', expires_in: 3600 })
    ).rejects.toThrow('Failed to fetch Google user info (HTTP 500)')

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useBackendStore.getState().backend).toBeNull()
  })
})
