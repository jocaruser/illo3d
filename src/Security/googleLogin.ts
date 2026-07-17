import { useAuthStore, type AuthUser } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

interface GoogleUserInfo {
  email: string
  name: string
  picture?: string
}

/** Fetches the signed-in user's profile from Google's OpenID userinfo endpoint. */
export async function fetchGoogleUserInfo(accessToken: string): Promise<AuthUser> {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch Google user info (HTTP ${response.status})`)
  }
  const info = (await response.json()) as GoogleUserInfo
  return { email: info.email, name: info.name, picture: info.picture }
}

/**
 * Completes a Google sign-in from the setup wizard: resolves the user's
 * profile, stores the credentials (memory-only token, absolute expiry) and
 * selects the Google Drive backend.
 */
export async function completeGoogleLogin(tokenResponse: {
  access_token: string
  expires_in: number
}): Promise<void> {
  const user = await fetchGoogleUserInfo(tokenResponse.access_token)
  useAuthStore.getState().login(user, {
    accessToken: tokenResponse.access_token,
    accessTokenExpiresAtMs: Date.now() + tokenResponse.expires_in * 1000,
  })
  useBackendStore.getState().setBackend('google-drive')
}
