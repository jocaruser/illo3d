import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  driveFetch,
  sheetsFetch,
  uploadMultipart,
} from '@/Repository/GSheet/GoogleApiClient'

const { authorizedFetchMock } = vi.hoisted(() => ({
  authorizedFetchMock: vi.fn(),
}))

vi.mock('@/Security/GoogleSession', () => ({
  GoogleSessionError: class GoogleSessionError extends Error {},
  authorizedFetch: authorizedFetchMock,
}))

function okResponse(body = ''): Response {
  return { ok: true, status: 200, text: async () => body } as Response
}

function errorResponse(
  status: number,
  body: string,
  retryAfter?: string
): Response {
  const headers = new Headers(
    retryAfter === undefined ? {} : { 'Retry-After': retryAfter }
  )
  return { ok: false, status, headers, text: async () => body } as Response
}

beforeEach(() => {
  authorizedFetchMock.mockReset()
  authorizedFetchMock.mockResolvedValue(okResponse())
})

describe('driveFetch', () => {
  it('prefixes the Drive v3 base and forwards the init', async () => {
    const init = { method: 'DELETE' }
    await driveFetch('/files/F1', init)
    expect(authorizedFetchMock).toHaveBeenCalledWith(
      'https://www.googleapis.com/drive/v3/files/F1',
      init
    )
  })

  it('throws with status and body snippet on non-2xx', async () => {
    authorizedFetchMock.mockResolvedValue(
      errorResponse(403, 'insufficient permissions')
    )
    await expect(driveFetch('/files/F1')).rejects.toThrow(
      'Google API request failed (403): insufficient permissions'
    )
  })

  it('truncates long error bodies to a snippet', async () => {
    authorizedFetchMock.mockResolvedValue(errorResponse(403, 'x'.repeat(1000)))
    await expect(driveFetch('/files/F1')).rejects.toThrow(
      `(403): ${'x'.repeat(300)}`
    )
  })

  it('propagates authorizedFetch failures untouched', async () => {
    authorizedFetchMock.mockRejectedValue(new Error('session expired'))
    await expect(driveFetch('/files/F1')).rejects.toThrow('session expired')
  })
})

describe('sheetsFetch', () => {
  it('prefixes the Sheets v4 base', async () => {
    await sheetsFetch('/spreadsheets/S1')
    expect(authorizedFetchMock).toHaveBeenCalledWith(
      'https://sheets.googleapis.com/v4/spreadsheets/S1',
      undefined
    )
  })
})

describe('retry with backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries a 429 after the base delay and succeeds', async () => {
    authorizedFetchMock
      .mockResolvedValueOnce(errorResponse(429, 'rate limited'))
      .mockResolvedValueOnce(okResponse('done'))

    const pending = driveFetch('/files/F1')
    await vi.advanceTimersByTimeAsync(500)

    expect((await pending).ok).toBe(true)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(2)
  })

  it('backs off exponentially across consecutive failures', async () => {
    authorizedFetchMock
      .mockResolvedValueOnce(errorResponse(503, 'unavailable'))
      .mockResolvedValueOnce(errorResponse(503, 'unavailable'))
      .mockResolvedValueOnce(okResponse('done'))

    const pending = sheetsFetch('/spreadsheets/S1')
    await vi.advanceTimersByTimeAsync(500)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(2)

    // The second retry waits 1000ms, not another 500ms.
    await vi.advanceTimersByTimeAsync(999)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)

    expect((await pending).ok).toBe(true)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(3)
  })

  it('honours the Retry-After header over the computed delay', async () => {
    authorizedFetchMock
      .mockResolvedValueOnce(errorResponse(429, 'rate limited', '2'))
      .mockResolvedValueOnce(okResponse())

    const pending = driveFetch('/files/F1')
    await vi.advanceTimersByTimeAsync(1999)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)

    expect((await pending).ok).toBe(true)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to exponential backoff on a malformed Retry-After', async () => {
    authorizedFetchMock
      .mockResolvedValueOnce(errorResponse(429, 'rate limited', 'soon'))
      .mockResolvedValueOnce(okResponse())

    const pending = driveFetch('/files/F1')
    await vi.advanceTimersByTimeAsync(500)

    expect((await pending).ok).toBe(true)
    expect(authorizedFetchMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after three attempts and throws the final status', async () => {
    authorizedFetchMock.mockResolvedValue(errorResponse(500, 'boom'))

    const expectation = expect(driveFetch('/files/F1')).rejects.toThrow(
      'Google API request failed (500): boom'
    )
    await vi.advanceTimersByTimeAsync(1500)

    await expectation
    expect(authorizedFetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry non-retryable statuses', async () => {
    authorizedFetchMock.mockResolvedValue(errorResponse(403, 'forbidden'))

    await expect(driveFetch('/files/F1')).rejects.toThrow('(403)')
    expect(authorizedFetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('uploadMultipart', () => {
  it('POSTs a multipart create to the upload base by default', async () => {
    await uploadMultipart({ name: 'file.json', parents: ['F1'] }, '{"a":1}')
    const [url, init] = authorizedFetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    )
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      'Content-Type': 'multipart/related; boundary=illo3d-multipart',
    })
    expect(init.body).toContain('{"name":"file.json","parents":["F1"]}')
    expect(init.body).toContain('Content-Type: application/json\r\n\r\n{"a":1}')
    expect(init.body).toContain('--illo3d-multipart--')
  })

  it('PATCHes the existing file when a fileId is given', async () => {
    await uploadMultipart({}, 'content', {
      fileId: 'F9',
      contentType: 'text/plain',
    })
    const [url, init] = authorizedFetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      'https://www.googleapis.com/upload/drive/v3/files/F9?uploadType=multipart'
    )
    expect(init.method).toBe('PATCH')
    expect(init.body).toContain('Content-Type: text/plain\r\n\r\ncontent')
  })

  it('throws with status and snippet on non-2xx', async () => {
    authorizedFetchMock.mockResolvedValue(errorResponse(404, 'File not found'))
    await expect(uploadMultipart({}, 'x')).rejects.toThrow(
      'Google API request failed (404): File not found'
    )
  })
})

describe('API base overrides', () => {
  it('honors VITE_GOOGLE_*_API_BASE so tests/dev can target the emulator', async () => {
    vi.stubEnv('VITE_GOOGLE_DRIVE_API_BASE', 'http://127.0.0.1:8790/drive/v3')
    vi.stubEnv('VITE_GOOGLE_SHEETS_API_BASE', 'http://127.0.0.1:8790/v4')
    vi.stubEnv(
      'VITE_GOOGLE_DRIVE_UPLOAD_API_BASE',
      'http://127.0.0.1:8790/upload/drive/v3'
    )
    vi.resetModules()
    try {
      const fresh = await import('@/Repository/GSheet/GoogleApiClient')
      await fresh.driveFetch('/files/F1')
      await fresh.sheetsFetch('/spreadsheets/S1')
      await fresh.uploadMultipart({}, 'x', { fileId: 'F9' })
      expect(authorizedFetchMock.mock.calls.map((call) => call[0])).toEqual([
        'http://127.0.0.1:8790/drive/v3/files/F1',
        'http://127.0.0.1:8790/v4/spreadsheets/S1',
        'http://127.0.0.1:8790/upload/drive/v3/files/F9?uploadType=multipart',
      ])
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
