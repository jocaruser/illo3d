import { useAuthStore } from '@/Store/authStore'

/**
 * Minimal typing for the Google Identity Services (GIS) token client surface
 * this app touches, plus the build-time env variable injected by Vite.
 */
interface GoogleTokenResponse {
  access_token?: string
  /** Token lifetime in seconds. */
  expires_in?: number
  error?: string
  error_description?: string
}

interface GoogleTokenClientError {
  type: string
  message?: string
}

interface GoogleTokenClientConfig {
  client_id: string
  scope: string
  prompt?: string
  callback(response: GoogleTokenResponse): void
  error_callback?(error: GoogleTokenClientError): void
}

interface GoogleTokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient
        }
      }
    }
  }

  interface ImportMetaEnv {
    /** Google OAuth client id, injected at build time from repo secrets. */
    readonly VITE_GOOGLE_CLIENT_ID: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

/**
 * The canonical Google auth-fetch layer.
 *
 * The access token lives only in the auth store's memory (never persisted —
 * see `src/Store/authStore.ts`). When it is missing or close to expiry, the
 * Google Identity Services token client renews it silently (`prompt: ''`),
 * so a page reload simply re-acquires a token without user interaction.
 * When silent renewal is impossible the auth store's
 * `googleSessionNeedsReauth` flag is raised and a `GoogleSessionError` is
 * thrown so the UI can route the user to an explicit sign-in.
 */
export const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.file'

/** Renew ahead of expiry so in-flight requests never carry a dying token. */
const FRESHNESS_MARGIN_MS = 5 * 60 * 1000

export class GoogleSessionError extends Error {}

/** Single-flight: concurrent callers share one in-flight renewal. */
let renewalInFlight: Promise<string> | null = null

function startRenewal(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fail = (message: string): void => {
      useAuthStore.getState().markGoogleSessionNeedsReauth()
      reject(new GoogleSessionError(message))
    }
    const { user } = useAuthStore.getState()
    if (user === null || user.email === '') {
      fail('No signed-in Google user to renew the session for')
      return
    }
    const google = window.google
    if (google === undefined) {
      fail('Google Identity Services are not loaded')
      return
    }
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: OAUTH_SCOPE,
      prompt: '',
      callback: (response) => {
        if (
          response.error !== undefined ||
          response.access_token === undefined ||
          response.expires_in === undefined
        ) {
          fail(`Silent token renewal failed: ${response.error ?? 'malformed token response'}`)
          return
        }
        useAuthStore.getState().patchGoogleCredentials({
          accessToken: response.access_token,
          accessTokenExpiresAtMs: Date.now() + response.expires_in * 1000,
        })
        resolve(response.access_token)
      },
      error_callback: (error) => {
        fail(`Silent token renewal failed: ${error.type}`)
      },
    })
    tokenClient.requestAccessToken()
  })
}

/** Force a renewal regardless of the current token's freshness. */
function renewGoogleAccessToken(): Promise<string> {
  renewalInFlight ??= startRenewal().finally(() => {
    renewalInFlight = null
  })
  return renewalInFlight
}

/**
 * Resolves a Google access token that is valid for at least five more
 * minutes, renewing silently when needed. Rejects with `GoogleSessionError`
 * (and marks `googleSessionNeedsReauth`) when renewal is impossible.
 */
export function ensureGoogleAccessToken(): Promise<string> {
  const { accessToken, accessTokenExpiresAtMs } = useAuthStore.getState()
  if (
    accessToken !== null &&
    accessTokenExpiresAtMs !== null &&
    accessTokenExpiresAtMs - Date.now() > FRESHNESS_MARGIN_MS
  ) {
    return Promise.resolve(accessToken)
  }
  return renewGoogleAccessToken()
}

function fetchWithBearer(url: string, init: RequestInit | undefined, token: string): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...init, headers })
}

/**
 * `fetch` with a fresh `Authorization: Bearer` header. On a 401 the token is
 * force-renewed once (bypassing the freshness fast path) and the request is
 * retried a single time; a second 401 — or a failed renewal — raises
 * `googleSessionNeedsReauth` and throws `GoogleSessionError`.
 */
export async function authorizedFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await ensureGoogleAccessToken()
  const response = await fetchWithBearer(url, init, token)
  if (response.status !== 401) return response

  const renewedToken = await renewGoogleAccessToken()
  const retried = await fetchWithBearer(url, init, renewedToken)
  if (retried.status === 401) {
    useAuthStore.getState().markGoogleSessionNeedsReauth()
    throw new GoogleSessionError('Google rejected a freshly renewed access token (401)')
  }
  return retried
}
