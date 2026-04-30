import { useAuthStore } from '@/stores/authStore'
import { ensureGoogleAccessToken } from '@/services/google/accessToken'
import { googleFetchWithAuthRetry } from '@/services/google/authorizedFetch'

export async function getAccessToken(): Promise<string> {
  const accessToken = useAuthStore.getState().credentials?.accessToken
  if (!accessToken) {
    return Promise.reject(new Error('No access token available. Please sign in.'))
  }
  return ensureGoogleAccessToken()
}

export async function sheetsFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = 'https://sheets.googleapis.com/v4'
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return googleFetchWithAuthRetry(url, { ...options, headers })
}
