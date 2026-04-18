import { useAuthStore } from '@/stores/authStore'

/** Minimal typings for the Google Picker script loaded at runtime. */
interface GooglePickerDocsView {
  setIncludeFolders: (include: boolean) => GooglePickerDocsView
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsView
  setSelectFolderEnabled: (enabled: boolean) => GooglePickerDocsView
}

declare global {
  interface Window {
    google?: {
      picker?: {
        PickerBuilder: new () => unknown
        DocsView: new (viewId?: string) => GooglePickerDocsView
        Action: { PICKED: string; CANCEL: string; ERROR: string }
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
