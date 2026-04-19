import { useAuthStore } from '@/stores/authStore'
import { GOOGLE_DRIVE_OAUTH_SCOPE } from '@/services/google/oauthScopes'

const PROACTIVE_RENEW_SKEW_MS = 5 * 60 * 1000

interface TokenClientResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

type GoogleOauth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (resp: TokenClientResponse) => void
  }) => TokenClient
}

function getGoogleOauth2(): GoogleOauth2 | undefined {
  const root = window.google as unknown as
    | { accounts?: { oauth2?: GoogleOauth2 } }
    | undefined
  return root?.accounts?.oauth2
}

let registeredClientId = ''

let renewalInFlight: Promise<void> | null = null

export function registerGoogleOAuthClientId(clientId: string): void {
  registeredClientId = clientId.trim()
}

function applyTokenResponse(resp: TokenClientResponse): void {
  const token = resp.access_token
  if (!token) {
    throw new Error(resp.error || 'Google token response had no access_token')
  }
  const expiresIn = resp.expires_in
  const accessTokenExpiresAtMs =
    typeof expiresIn === 'number' && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : undefined
  useAuthStore.getState().patchGoogleCredentials({
    accessToken: token,
    accessTokenExpiresAtMs,
  })
  useAuthStore.getState().clearGoogleSessionNeedsReauth()
}

function renewGoogleAccessTokenInternal(): Promise<void> {
  return new Promise((resolve, reject) => {
    const oauth2 = getGoogleOauth2()
    if (!oauth2?.initTokenClient) {
      reject(new Error('Google Identity Services is not available'))
      return
    }
    if (!registeredClientId) {
      reject(new Error('Google OAuth client ID is not registered'))
      return
    }
    const client = oauth2.initTokenClient({
      client_id: registeredClientId,
      scope: GOOGLE_DRIVE_OAUTH_SCOPE,
      callback: (tokenResponse: TokenClientResponse) => {
        try {
          applyTokenResponse(tokenResponse)
          resolve()
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      },
    }) as TokenClient
    client.requestAccessToken({ prompt: '' })
  })
}

export function renewGoogleAccessTokenSingleFlight(): Promise<void> {
  if (!renewalInFlight) {
    renewalInFlight = renewGoogleAccessTokenInternal().finally(() => {
      renewalInFlight = null
    })
  }
  return renewalInFlight
}

function shouldRenewProactively(expiresAtMs: number | undefined, now: number): boolean {
  if (expiresAtMs === undefined) {
    return false
  }
  return expiresAtMs - now <= PROACTIVE_RENEW_SKEW_MS
}

export async function ensureGoogleAccessToken(): Promise<string> {
  const { credentials } = useAuthStore.getState()
  const token = credentials?.accessToken
  if (!token) {
    throw new Error('No access token available. Please sign in.')
  }
  const now = Date.now()
  if (shouldRenewProactively(credentials?.accessTokenExpiresAtMs, now)) {
    try {
      await renewGoogleAccessTokenSingleFlight()
    } catch {
      // Token may still work briefly; 401 + failed renewal marks session invalid.
    }
  }
  const updated = useAuthStore.getState().credentials?.accessToken
  if (!updated) {
    throw new Error('No access token available. Please sign in.')
  }
  return updated
}
