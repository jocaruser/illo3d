import { useAuthStore } from '@/stores/authStore'

declare global {
  interface Window {
    google?: {
      picker?: {
        PickerBuilder: new () => unknown
        DocsView: new (viewId?: string) => { setIncludeFolders: (v: boolean) => unknown; setSelectFolderEnabled: (v: boolean) => unknown }
        Action: { PICKED: string }
      }
    }
    gapi?: { load: (api: string, callback: () => void) => void }
  }
}

export function getAccessToken(): Promise<string> {
  const accessToken = useAuthStore.getState().credentials?.accessToken
  if (!accessToken) {
    return Promise.reject(new Error('No access token available. Please sign in.'))
  }
  return Promise.resolve(accessToken)
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
