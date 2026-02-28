const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export function getAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    return Promise.reject(new Error('VITE_GOOGLE_CLIENT_ID is not configured'))
  }

  const google = window.google
  if (!google?.accounts?.oauth2) {
    return Promise.reject(new Error('Google Identity Services not loaded'))
  }

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SHEETS_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        if (response.access_token) {
          resolve(response.access_token)
        } else {
          reject(new Error('No access token received'))
        }
      },
    })
    tokenClient.requestAccessToken()
  })
}

export async function sheetsFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = 'https://sheets.googleapis.com/v4'
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response
}
