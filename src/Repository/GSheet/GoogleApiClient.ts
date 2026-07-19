import { authorizedFetch } from '@/Security/GoogleSession'

/**
 * Thin transport layer for the Google backend. Every request flows through
 * `authorizedFetch` (bearer token + one silent renewal on 401). Rate-limited
 * (429) and transient server (5xx) responses are retried with exponential
 * backoff — honouring a `Retry-After` header when Google sends one — before
 * any remaining non-2xx response becomes an error carrying the status and a
 * response-body snippet. The Sheets/Drive calls the app makes are
 * replace-style writes, so re-sending one after a server error is safe.
 */

declare global {
  interface ImportMetaEnv {
    /** Test/dev overrides pointing at a local emulator (google-drive-api-mock). */
    readonly VITE_GOOGLE_DRIVE_API_BASE?: string
    readonly VITE_GOOGLE_SHEETS_API_BASE?: string
    readonly VITE_GOOGLE_DRIVE_UPLOAD_API_BASE?: string
  }
}

// The real Google endpoints are the inline defaults on purpose: production
// builds define no override, so the shipped bundle contains only these URLs.
const DRIVE_BASE =
  import.meta.env.VITE_GOOGLE_DRIVE_API_BASE ??
  'https://www.googleapis.com/drive/v3'
const SHEETS_BASE =
  import.meta.env.VITE_GOOGLE_SHEETS_API_BASE ??
  'https://sheets.googleapis.com/v4'
const UPLOAD_BASE =
  import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_API_BASE ??
  'https://www.googleapis.com/upload/drive/v3'

const MULTIPART_BOUNDARY = 'illo3d-multipart'

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
/** Total tries per request: the first attempt plus two retries. */
const MAX_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 500

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfterSeconds = Number(response.headers.get('Retry-After'))
  if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0)
    return retryAfterSeconds * 1000
  return BASE_RETRY_DELAY_MS * 2 ** attempt
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  let response = await authorizedFetch(url, init)
  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS - 1 && RETRYABLE_STATUSES.has(response.status);
    attempt++
  ) {
    await sleep(retryDelayMs(response, attempt))
    response = await authorizedFetch(url, init)
  }
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
