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

function errorResponse(status: number, body: string): Response {
  return { ok: false, status, text: async () => body } as Response
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
    authorizedFetchMock.mockResolvedValue(errorResponse(500, 'x'.repeat(1000)))
    await expect(driveFetch('/files/F1')).rejects.toThrow(
      `(500): ${'x'.repeat(300)}`
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
