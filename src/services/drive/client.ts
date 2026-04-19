import { googleFetchWithAuthRetry } from '@/services/google/authorizedFetch'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

export async function driveFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${DRIVE_API_BASE}${path}`
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return googleFetchWithAuthRetry(url, { ...options, headers })
}
