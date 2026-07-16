import { authorizedFetch } from '@/Security/GoogleSession'

/**
 * Thin transport layer for the Google backend. Every request flows through
 * `authorizedFetch` (bearer token + one silent renewal on 401) and non-2xx
 * responses become errors carrying the status and a response-body snippet.
 */

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const SHEETS_BASE = 'https://sheets.googleapis.com/v4'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

const MULTIPART_BOUNDARY = 'illo3d-multipart'

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await authorizedFetch(url, init)
  if (!response.ok) {
    const snippet = (await response.text()).slice(0, 300)
    throw new Error(
      `Google API request failed (${response.status}): ${snippet}`
    )
  }
  return response
}

/** Drive v3 request; `path` starts with `/` and is appended to the API base. */
export function driveFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return apiFetch(`${DRIVE_BASE}${path}`, init)
}

/** Sheets v4 request; `path` starts with `/` and is appended to the API base. */
export function sheetsFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return apiFetch(`${SHEETS_BASE}${path}`, init)
}

export interface UploadMultipartOptions {
  /** Update this existing file's content (PATCH) instead of creating one (POST). */
  fileId?: string
  /** MIME type of the content part. Defaults to `application/json`. */
  contentType?: string
}

/**
 * Drive multipart upload: file metadata (JSON) + content in one request.
 * Creates a new file, or updates `options.fileId` when given.
 */
export function uploadMultipart(
  metadata: Record<string, unknown>,
  content: string,
  options: UploadMultipartOptions = {}
): Promise<Response> {
  const body = [
    `--${MULTIPART_BOUNDARY}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${MULTIPART_BOUNDARY}`,
    `Content-Type: ${options.contentType ?? 'application/json'}`,
    '',
    content,
    `--${MULTIPART_BOUNDARY}--`,
  ].join('\r\n')
  const path = options.fileId ? `/files/${options.fileId}` : '/files'
  return apiFetch(`${UPLOAD_BASE}${path}?uploadType=multipart`, {
    method: options.fileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
    },
    body,
  })
}
