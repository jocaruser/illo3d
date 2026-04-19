import { ensureGoogleAccessToken, renewGoogleAccessTokenSingleFlight } from '@/services/google/accessToken'
import { useAuthStore } from '@/stores/authStore'

export class GoogleSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleSessionError'
  }
}

export async function googleFetchWithAuthRetry(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const firstToken = await ensureGoogleAccessToken()

  const run = (token: string) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...init, headers })
  }

  let response = await run(firstToken)
  if (response.status !== 401) {
    return response
  }

  try {
    await renewGoogleAccessTokenSingleFlight()
  } catch {
    useAuthStore.getState().markGoogleSessionNeedsReauth()
    throw new GoogleSessionError('GOOGLE_SESSION_EXPIRED')
  }

  const secondToken = await ensureGoogleAccessToken().catch(() => {
    useAuthStore.getState().markGoogleSessionNeedsReauth()
    throw new GoogleSessionError('GOOGLE_SESSION_EXPIRED')
  })

  response = await run(secondToken)
  if (response.status === 401) {
    useAuthStore.getState().markGoogleSessionNeedsReauth()
    throw new GoogleSessionError('GOOGLE_SESSION_EXPIRED')
  }
  return response
}
