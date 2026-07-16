import type { useAuthStore as UseAuthStore } from '@/Store/authStore'
import { installFakeLocalStorage } from '../Store/memoryLocalStorage'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClientConfig {
  client_id: string
  scope: string
  prompt?: string
  callback(response: TokenResponse): void
  error_callback?(error: { type: string }): void
}

type SessionModule = typeof import('@/Security/GoogleSession')

async function loadSession(): Promise<{
  useAuthStore: typeof UseAuthStore
  session: SessionModule
}> {
  vi.resetModules()
  const { useAuthStore } = await import('@/Store/authStore')
  const session = await import('@/Security/GoogleSession')
  return { useAuthStore, session }
}

function signInGoogleUser(useAuthStore: typeof UseAuthStore, expiresInMs: number): void {
  useAuthStore.getState().login(
    { email: 'ada@example.com', name: 'Ada Lovelace' },
    { accessToken: 'initial-token', accessTokenExpiresAtMs: Date.now() + expiresInMs }
  )
}

/**
 * Stubs `window.google` with a token client whose `requestAccessToken`
 * invokes `onRequest` with the captured config, letting each test decide
 * when and how the GIS callbacks fire.
 */
function stubGoogleIdentity(onRequest: (config: TokenClientConfig) => void) {
  const initTokenClient = vi.fn((config: TokenClientConfig) => ({
    requestAccessToken: vi.fn(() => onRequest(config)),
  }))
  vi.stubGlobal('google', { accounts: { oauth2: { initTokenClient } } })
  return initTokenClient
}

function stubGoogleIdentityResolving(accessToken: string, expiresInSeconds = 3600) {
  return stubGoogleIdentity((config) =>
    config.callback({ access_token: accessToken, expires_in: expiresInSeconds })
  )
}

const FRESH_MS = 60 * 60 * 1000
const STALE_MS = 4 * 60 * 1000

describe('ensureGoogleAccessToken', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns the in-memory token when it is fresh for more than five minutes', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    const initTokenClient = stubGoogleIdentityResolving('never-used')

    await expect(session.ensureGoogleAccessToken()).resolves.toBe('initial-token')
    expect(initTokenClient).not.toHaveBeenCalled()
  })

  it('renews silently when the token expires within five minutes', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    const initTokenClient = stubGoogleIdentityResolving('renewed-token', 3600)
    const before = Date.now()

    await expect(session.ensureGoogleAccessToken()).resolves.toBe('renewed-token')

    expect(initTokenClient).toHaveBeenCalledExactlyOnceWith({
      client_id: 'test-client-id',
      scope: session.OAUTH_SCOPE,
      prompt: '',
      callback: expect.any(Function),
      error_callback: expect.any(Function),
    })
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('renewed-token')
    expect(state.accessTokenExpiresAtMs).toBeGreaterThanOrEqual(before + 3_600_000)
    expect(state.accessTokenExpiresAtMs).toBeLessThanOrEqual(Date.now() + 3_600_000)
    expect(state.googleSessionNeedsReauth).toBe(false)
  })

  it('renews when no token is held at all', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    useAuthStore.setState({ accessToken: null, accessTokenExpiresAtMs: null })
    stubGoogleIdentityResolving('renewed-token')

    await expect(session.ensureGoogleAccessToken()).resolves.toBe('renewed-token')
  })

  it('shares one in-flight renewal between concurrent callers', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    const pendingConfigs: TokenClientConfig[] = []
    const initTokenClient = stubGoogleIdentity((config) => pendingConfigs.push(config))

    const first = session.ensureGoogleAccessToken()
    const second = session.ensureGoogleAccessToken()
    expect(initTokenClient).toHaveBeenCalledTimes(1)

    pendingConfigs[0].callback({ access_token: 'renewed-token', expires_in: 3600 })
    await expect(first).resolves.toBe('renewed-token')
    await expect(second).resolves.toBe('renewed-token')
  })

  it('resets the single-flight slot once a renewal settles', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    // Renewed tokens live only 60s, so every call needs a fresh renewal.
    const initTokenClient = stubGoogleIdentityResolving('short-lived-token', 60)

    await session.ensureGoogleAccessToken()
    await session.ensureGoogleAccessToken()

    expect(initTokenClient).toHaveBeenCalledTimes(2)
  })

  it('resets the single-flight slot after a failed renewal', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    const initTokenClient = stubGoogleIdentity((config) =>
      config.callback({ error: 'interaction_required' })
    )

    await expect(session.ensureGoogleAccessToken()).rejects.toBeInstanceOf(
      session.GoogleSessionError
    )
    await expect(session.ensureGoogleAccessToken()).rejects.toBeInstanceOf(
      session.GoogleSessionError
    )
    expect(initTokenClient).toHaveBeenCalledTimes(2)
  })

  it('fails and marks reauth when GIS reports an error in the token response', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    stubGoogleIdentity((config) => config.callback({ error: 'interaction_required' }))

    await expect(session.ensureGoogleAccessToken()).rejects.toThrow(
      'Silent token renewal failed: interaction_required'
    )
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('fails when the token response carries no access token', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    stubGoogleIdentity((config) => config.callback({ expires_in: 3600 }))

    await expect(session.ensureGoogleAccessToken()).rejects.toThrow(
      'Silent token renewal failed: malformed token response'
    )
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('fails when the token response carries no expiry', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    stubGoogleIdentity((config) => config.callback({ access_token: 'renewed-token' }))

    await expect(session.ensureGoogleAccessToken()).rejects.toBeInstanceOf(
      session.GoogleSessionError
    )
  })

  it('fails and marks reauth when the GIS error callback fires', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    stubGoogleIdentity((config) => config.error_callback?.({ type: 'popup_failed_to_open' }))

    await expect(session.ensureGoogleAccessToken()).rejects.toThrow(
      'Silent token renewal failed: popup_failed_to_open'
    )
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('fails and marks reauth when Google Identity Services are not loaded', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, STALE_MS)
    vi.stubGlobal('google', undefined)

    await expect(session.ensureGoogleAccessToken()).rejects.toThrow(
      'Google Identity Services are not loaded'
    )
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('fails when nobody is signed in', async () => {
    const { useAuthStore, session } = await loadSession()
    stubGoogleIdentityResolving('never-used')

    await expect(session.ensureGoogleAccessToken()).rejects.toThrow(
      'No signed-in Google user to renew the session for'
    )
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('fails for the synthetic local user', async () => {
    const { useAuthStore, session } = await loadSession()
    useAuthStore.getState().loginAsLocalUser()
    stubGoogleIdentityResolving('never-used')

    await expect(session.ensureGoogleAccessToken()).rejects.toBeInstanceOf(
      session.GoogleSessionError
    )
  })
})

describe('authorizedFetch', () => {
  beforeEach(() => {
    installFakeLocalStorage()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  function stubFetch(...responses: Response[]) {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()
    for (const response of responses) fetchMock.mockResolvedValueOnce(response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  function authHeaderOfCall(fetchMock: ReturnType<typeof stubFetch>, call: number): string | null {
    const init = fetchMock.mock.calls[call][1]
    return new Headers(init?.headers).get('Authorization')
  }

  it('sends the bearer token and returns the response', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))

    const response = await session.authorizedFetch('https://api.example.com/data')

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/data')
    expect(authHeaderOfCall(fetchMock, 0)).toBe('Bearer initial-token')
  })

  it('preserves the caller init while adding the Authorization header', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    await session.authorizedFetch('https://api.example.com/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"a":1}',
    })

    const init = fetchMock.mock.calls[0][1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"a":1}')
    const headers = new Headers(init?.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer initial-token')
  })

  it('renews once on 401 — bypassing the freshness check — and retries', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    const initTokenClient = stubGoogleIdentityResolving('renewed-token')
    const fetchMock = stubFetch(
      new Response(null, { status: 401 }),
      new Response('ok', { status: 200 })
    )

    const response = await session.authorizedFetch('https://api.example.com/data')

    expect(response.status).toBe(200)
    // The token was fresh, so only the forced post-401 renewal ran.
    expect(initTokenClient).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(authHeaderOfCall(fetchMock, 0)).toBe('Bearer initial-token')
    expect(authHeaderOfCall(fetchMock, 1)).toBe('Bearer renewed-token')
  })

  it('throws and marks reauth when the retried request is 401 again', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    stubGoogleIdentityResolving('renewed-token')
    const fetchMock = stubFetch(
      new Response(null, { status: 401 }),
      new Response(null, { status: 401 })
    )

    await expect(session.authorizedFetch('https://api.example.com/data')).rejects.toThrow(
      'Google rejected a freshly renewed access token (401)'
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('throws when the post-401 renewal itself fails', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    stubGoogleIdentity((config) => config.callback({ error: 'interaction_required' }))
    const fetchMock = stubFetch(new Response(null, { status: 401 }))

    await expect(session.authorizedFetch('https://api.example.com/data')).rejects.toBeInstanceOf(
      session.GoogleSessionError
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().googleSessionNeedsReauth).toBe(true)
  })

  it('propagates non-401 error statuses without retrying', async () => {
    const { useAuthStore, session } = await loadSession()
    signInGoogleUser(useAuthStore, FRESH_MS)
    const fetchMock = stubFetch(new Response(null, { status: 500 }))

    const response = await session.authorizedFetch('https://api.example.com/data')

    expect(response.status).toBe(500)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
