import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exchangeSaToken } from './devLogin'

const mockSign = vi.fn().mockResolvedValue('mock-jwt')
vi.mock('jose', () => {
  return {
    SignJWT: class {
      setProtectedHeader = vi.fn().mockReturnThis()
      setIssuer = vi.fn().mockReturnThis()
      setAudience = vi.fn().mockReturnThis()
      setIssuedAt = vi.fn().mockReturnThis()
      setExpirationTime = vi.fn().mockReturnThis()
      sign = mockSign
    },
    importPKCS8: vi.fn().mockResolvedValue({}),
  }
})

beforeEach(() => {
  vi.stubEnv('VITE_SA_CLIENT_EMAIL', 'test@project.iam.gserviceaccount.com')
  vi.stubEnv('VITE_SA_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'noop' }) } as Response))
})

describe('exchangeSaToken', () => {
  it('throws when credentials are missing', async () => {

    await expect(exchangeSaToken()).rejects.toThrow(
      'VITE_SA_CREDENTIALS_FILE (path to SA JSON) must be set'
    )
  })

  it('returns access token on successful exchange', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'test-token-123' }),
    } as Response)

    const token = await exchangeSaToken()

    expect(token).toBe('test-token-123')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    )
  })

  it('throws when token endpoint returns error', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('invalid_grant'),
    } as Response)

    await expect(exchangeSaToken()).rejects.toThrow('Token exchange failed')
  })
})
