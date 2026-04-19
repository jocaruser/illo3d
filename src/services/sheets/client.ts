import { useAuthStore } from '@/stores/authStore'
import { ensureGoogleAccessToken } from '@/services/google/accessToken'
import { googleFetchWithAuthRetry } from '@/services/google/authorizedFetch'

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
        Response?: { ACTION: string; DOCUMENTS: string }
      }
    }
    gapi?: { load: (api: string, callback: () => void) => void }
  }
}

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
