import { getAccessToken } from '@/services/sheets/client'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

export async function driveFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken()
  const url = path.startsWith('http') ? path : `${DRIVE_API_BASE}${path}`
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
